const sgMail = require('@sendgrid/mail')
const sendgridApiKey = process.env.SENDGRID_API_KEY

sgMail.setApiKey(sendgridApiKey)

const sendAccountCreationMail = (email, name) =>{
    sgMail.send({
        to:email,
        from:'aishwarya.roychoudhury@gmail.com',
        subject:'Thanks for joining in!',
        text:`Welcome to the app ${name}!`
    })
}

const sendAccountDeletionMail = (email, name) =>{
    sgMail.send({
        to:email,
        from:'aishwarya.roychoudhury@gmail.com',
        subject:'Sorry to see you go!',
        text:`Goodbye, ${name}! I hope to see you back sometime soon.`
    })
}

module.exports = {
    sendAccountCreationMail,
    sendAccountDeletionMail
}

