document.addEventListener('DOMContentLoaded', function () {
    fetchData();
});

function fetchData() {
    fetch('/api/check')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                populateTable(data);
            } else if (data.error) {
                console.error('Server error:', data.error);
            } else {
                console.error('Unexpected data format:', data);
            }
        })
        .catch(error => console.error('Error:', error));
}

function populateTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    if (!Array.isArray(data)) {
        console.error('Data is not an array:', data);
        return;
    }

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="名字">${row.name || ''}</td>
            <td data-label="Telegram 用户名">${row.username || ''}</td>
            <td data-label="电话">${row.phone || ''}</td>
            <td data-label="个人信息">${row.personal_info || ''}</td>
            <td data-label="原因">${row.reason || ''}</td>
            <td data-label="操作">
                <div class="action-buttons">
                    <a href="#" class="edit-button" title="Edit" data-id="${row.id}" data-row='${JSON.stringify(row)}'>✏️</a>
                    <a href="#" class="delete-button" title="Delete" data-id="${row.id}">❌</a>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Ensure that edit buttons work after table is populated
    const editButtons = document.querySelectorAll('.edit-button');
    editButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            const rowData = JSON.parse(event.target.dataset.row);  // Correctly parse the data from the attribute
            const rowId = event.target.dataset.id;  // Get the ID from data attribute
            console.log('Editing row:', rowData);
            editRow(rowId, rowData);  // Pass the ID and row data to editRow
        });
    });

    // Ensure that delete buttons work after table is populated
    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            const rowId = event.target.dataset.id;  // Correct way to get the ID
            console.log('Deleting row with id:', rowId);  // Log to ensure correct ID is passed
            deleteRow(rowId);  // Pass the correct id to deleteRow
        });
    });
}



function editRow(id, rowData) {
    console.log('Editing row')
    // Check if rowData is passed and is an object
    if (!rowData || typeof rowData !== 'object') {
        console.error('Invalid rowData:', rowData);
        return;  // Prevent the function from proceeding if rowData is invalid
    }
    // Call API to insert the row into another table (e.g., "scammer")
    fetch('/api/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData)  // Send the row data
    })
        .then(response => response.json())
        .then(data => {
            console.log('Row inserted:', data);
            deleteRow(id);  // After inserting, delete the original row
        })
        .catch(error => console.error('Error inserting row:', error));
}


function deleteRow(id) {
    console.log("Row id to delete:", id);  // Log the id to ensure it's correct
    if (!id) {
        console.error('No ID provided for deletion');
        return;  // Prevent further action if id is missing
    }
    fetch(`/api/delete/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            fetchData();  // Reload the data after deletion
        })
        .catch(error => console.error('Error deleting row:', error));
}
