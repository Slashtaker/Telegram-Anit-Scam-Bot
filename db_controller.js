const { Pool } = require('pg');

/**
 * Database Controller for CRUD operations.
 */
class DBController {
    /**
     * Initializes the DBController instance with a connection pool.
     * @param {Object} config - Database connection configuration.
     */
    constructor(config) {
        this.pool = new Pool(config);
    }

    /**
     * Executes a SQL query with parameters.
     * @param {string} query - The SQL query.
     * @param {Array} [params=[]] - The query parameters.
     * @returns {Promise<Object[]>} - Query results.
     */
    async execute(query, params = []) {
        try {
            const { rows } = await this.pool.query(query, params);
            return rows;
        } catch (error) {
            console.error(`Query failed: ${query}\nParams: ${JSON.stringify(params)}\nError:`, error);
            throw new Error('Database operation failed.');
        }
    }

    /**
     * Inserts a record into a specified table.
     * @param {string} table - The table name.
     * @param {Object} data - Key-value pairs representing the record.
     * @returns {Promise<Object>} - The inserted row.
     */
    async insert(table, data) {
        if (!table || typeof table !== 'string' || Object.keys(data).length === 0) {
            throw new Error('Invalid table name or empty data.');
        }

        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO "${table}" (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *;`;
        return this.execute(query, values);
    }

    /**
     * Deletes records from a specified table based on conditions.
     * @param {string} table - The table name.
     * @param {Object} conditions - Key-value pairs for the WHERE clause.
     * @returns {Promise<Object[]>} - The deleted rows.
     */
    async delete(table, conditions) {
        if (!table || typeof table !== 'string' || Object.keys(conditions).length === 0) {
            throw new Error('Invalid table name or empty conditions.');
        }

        const { clause, params } = this._buildWhereClause(conditions);
        const query = `DELETE FROM "${table}" ${clause} RETURNING *;`;
        return this.execute(query, params);
    }

    /**
     * Updates records in a specified table based on conditions.
     * @param {string} table - The table name.
     * @param {Object} updates - Key-value pairs for updates.
     * @param {Object} conditions - Key-value pairs for the WHERE clause.
     * @returns {Promise<Object[]>} - The updated rows.
     */
    async update(table, updates, conditions) {
        if (!table || typeof table !== 'string' || Object.keys(updates).length === 0 || Object.keys(conditions).length === 0) {
            throw new Error('Invalid table name, empty updates or conditions.');
        }

        const { clause: setClause, params: setParams } = this._buildSetClause(updates);
        const { clause: whereClause, params: whereParams } = this._buildWhereClause(conditions, setParams.length + 1);

        const query = `UPDATE "${table}" SET ${setClause} ${whereClause} RETURNING *;`;
        return this.execute(query, [...setParams, ...whereParams]);
    }

    /**
     * Searches for records in a specified table based on conditions.
     * @param {string} table - The table name.
     * @param {Object} [conditions={}] - Key-value pairs for the WHERE clause.
     * @returns {Promise<Object[]>} - The matching rows.
     */
    async search(table, conditions = {}) {
        if (!table || typeof table !== 'string') {
            throw new Error('Invalid table name.');
        }

        const { clause, params } = this._buildWhereClause(conditions);
        const query = `SELECT * FROM "${table}" ${clause};`;
        return this.execute(query, params);
    }

    /**
     * Searches for records in a specified table where a column contains a substring.
     * @param {string} table - The table name.
     * @param {string} column - The column to search within.
     * @param {string} substring - The substring to search for.
     * @returns {Promise<Object[]>} - The matching rows.
     */
    async searchBySubstring(table, column, substring) {
        if (!table || typeof table !== 'string' || !column || typeof column !== 'string' || !substring) {
            throw new Error('Invalid table name, column, or substring.');
        }

        const query = `SELECT * FROM "${table}" WHERE "${column}"::text LIKE $1;`;
        const params = [`%${substring}%`]; // Adds wildcards for substring matching
        return this.execute(query, params);
    }

    /**
     * Closes the database connection pool.
     */
    async close() {
        try {
            await this.pool.end();
            console.log('Database connection closed.');
        } catch (error) {
            console.error('Error closing database connection:', error);
        }
    }

    /**
     * Builds a SQL `WHERE` clause.
     * @private
     * @param {Object} conditions - Key-value pairs for the WHERE clause.
     * @param {number} [startIndex=1] - Placeholder index for parameters.
     * @returns {{ clause: string, params: Array }} - WHERE clause and parameters.
     */
    _buildWhereClause(conditions, startIndex = 1) {
        const keys = Object.keys(conditions);
        if (!keys.length) return { clause: '', params: [] };

        const clause = `WHERE ${keys.map((key, i) => `"${key}" = $${i + startIndex}`).join(' AND ')}`;
        const params = Object.values(conditions);
        return { clause, params };
    }

    /**
     * Builds a SQL `SET` clause for updates.
     * @private
     * @param {Object} updates - Key-value pairs for updates.
     * @returns {{ clause: string, params: Array }} - SET clause and parameters.
     */
    _buildSetClause(updates) {
        const keys = Object.keys(updates);
        if (!keys.length) throw new Error('No update fields provided.');

        const clause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
        const params = Object.values(updates);
        return { clause, params };
    }
}

module.exports = { DBController };
