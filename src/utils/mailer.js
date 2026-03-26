import emailjs from '@emailjs/browser';

// EmailJS Initialization
// TODO: Replace with your real EmailJS keys: https://www.emailjs.com/
const PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY"; 
const SERVICE_ID = "YOUR_SERVICE_ID";
const TEMPLATE_ID = "YOUR_TEMPLATE_ID";

emailjs.init(PUBLIC_KEY);

export const sendStatusEmail = async (proposalTitle, status, recipientEmail, recipientName) => {
  if (PUBLIC_KEY === "YOUR_EMAILJS_PUBLIC_KEY") {
    console.warn("EmailJS is not configured. Email will not actually send to:", recipientEmail);
    return false;
  }

  try {
    const templateParams = {
      to_name: recipientName || "Society Representative",
      to_email: recipientEmail,
      proposal_title: proposalTitle,
      status: status,
      message: `Your event proposal "${proposalTitle}" has been ${status}. Please check your CampusBook dashboard for details.`,
    };

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    console.log("SUCCESS! Email sent!", response.status, response.text);
    return true;
  } catch (error) {
    console.error("FAILED to send email:", error);
    return false;
  }
};
