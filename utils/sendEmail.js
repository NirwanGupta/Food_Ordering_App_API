const nodemailer = require(`nodemailer`);
const nodemailerConfig = require(`./nodemailerConfig`);

const sendEmail = async ({to, subject, html}) => {
    // const testAccont = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport(nodemailerConfig);
    return transporter.sendMail({
        from: '"Nirwan Gupta", <adminNirwan@gmail.com',
        to,
        subject,
        html,
    });
}

module.exports = sendEmail;