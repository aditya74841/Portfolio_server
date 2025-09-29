// import Mailgen from "mailgen";
// import nodemailer from "nodemailer";

// /**
//  * Send email for contact form submission
//  * @param {{ name: string, email?: string, description: string, ip: string }} contact
//  */
// const sendContactEmail = async (contact) => {
//   const mailGenerator = new Mailgen({
//     theme: "default",
//     product: {
//       name: process.env.EMAIL_SENDER_NAME,
//       link: process.env.EMAIL_SENDER_LINK,
//     },
//   });

//   // Build the email content
//   const emailContent = {
//     body: {
//       name: "Portfolio Owner",
//       intro: `You have a new contact form submission!`,
//       table: {
//         data: [
//           { label: "Name", value: contact.name },
//           { label: "Email", value: contact.email || "Not provided" },
//           { label: "Message", value: contact.description },
//           { label: "IP Address", value: contact.ip },
//         ],
//       },
//       outro: "This message was sent from your portfolio contact form.",
//     },
//   };

//   const emailHtml = mailGenerator.generate(emailContent);
//   const emailText = mailGenerator.generatePlaintext(emailContent);

//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     secure: true,
//     port: 465,
//     auth: {
//       user: process.env.MAILTRAP_SMTP_USER,
//       pass: process.env.MAILTRAP_SMTP_PASS,
//     },
//   });

//   const mail = {
//     from: { name: process.env.EMAIL_SENDER_NAME, address: process.env.MAILTRAP_SMTP_USER },
//     to: process.env.CONTACT_RECEIVER_EMAIL,
//     subject: `📩 New Contact Message from ${contact.name}`,
//     text: emailText,
//     html: emailHtml,
//   };

//   try {
//     await transporter.sendMail(mail);
//   } catch (error) {
//     console.log(
//       "Email service failed silently. Check MAILTRAP or Gmail credentials."
//     );
//     console.log("Error: ", error);
//   }
// };

// export { sendContactEmail };


import nodemailer from "nodemailer";

/**
 * Send contact form message to your email
 * @param {{ name: string, email: string, description: string, ip: string }} options
 */
const sendContactEmail = async (options) => {
  const { name, email, description, ip } = options;

  // Create Gmail transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAILTRAP_SMTP_USER, // your Gmail
      pass: process.env.MAILTRAP_SMTP_PASS, // app password from Gmail
    },
  });

  // Construct the email
  const mail = {
    from: { 
      name: process.env.EMAIL_SENDER_NAME, 
      address: process.env.MAILTRAP_SMTP_USER 
    },
    to: process.env.EMAIL_SENDER_LINK, // recipient of contact form messages
    subject: `New Contact Form Submission from ${name}`,
    text: `
Name: ${name}
Email: ${email}
Message: ${description}
IP Address: ${ip}
    `,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${description}</p>
      <p><strong>IP Address:</strong> ${ip}</p>
    `,
  };

  try {
    await transporter.sendMail(mail);
    console.log("Contact email sent successfully!");
  } catch (error) {
    console.error(
      "Email service failed silently. Check Gmail SMTP credentials.",
      error
    );
  }
};

export { sendContactEmail };
