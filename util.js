class util {
    /**
     * Extracts key-value pairs from a string formatted as "key: value" on each line.
     * @param {string} data - The input string containing key-value pairs.
     * @returns {Object} An object with keys and values extracted from the input string.
     */
    static extractKeyValuePairs(data) {
        return data
            .trim()  // Remove any leading/trailing whitespace
            .split('\n')  // Split input into individual lines
            .reduce((acc, line) => {
                // Split each line into key and value at the first colon
                const [key, value] = line.split(':').map(item => item.trim());
                if (key) {  // Ensure key exists
                    // Replace empty values with an empty string
                    acc[key] = value || "";  // If value is empty, set it to ""
                }
                return acc;
            }, {});  // Start with an empty object
    }
    static containsSpecialCharacters = (text) => {
        const specialCharactersRegex = /[（）~\`!@#$%^&*\[\]\{\}\;:\'\"|\\()\-_=+,<.>/?]/; // Matches any of the specified characters
        return specialCharactersRegex.test(text); // Returns true if found, false otherwise
    };

    static removeDuplicates = (array) => {
        // remove Duplicates array
        return array.filter((item, index) => array.indexOf(item) === index);
    }
}


module.exports = util ;