const { Resend } = require('resend');
const logger = require('../utils/logger');

class Mailer {
    constructor() {
        this.client = new Resend(process.env.RESEND_API_KEY);
    }

    /**
     * @param {Object} options
     * @param {string} options.from
     * @param {string[]} options.to
     * @param {string} options.subject
     * @param {string} options.html
     * @param {Array} [options.attachments]
     */
    async send(options) {
        try {
            const response = await this.client.emails.send({
                from: options.from,
                to: options.to,
                subject: options.subject,
                html: options.html,
                attachments: options.attachments || [],
            });

            if (response.error) {
                const error = new Error(`Resend Error: ${JSON.stringify(response.error)}`);
                logger.error("Mailer Service Error:", err);
                throw error;
            }

            return response.data;
        } catch (error) {
            logger.error("Mailer Service Error:", error);
            throw error;
        }
    }
}

module.exports = new Mailer();