/**
 * Normal Domain: Extracts the hostname exactly as it appears in the URL.
 * Example: "https://www.biobrain.in/quiz" -> "www.biobrain.in"
 */
const getNormalDomain = () => {
  try {
    return new URL(process.env.BASE_URI).hostname;
  } catch (error) {
    return "www.biobrain.xyz"; // Fallback
  }
};

/**
 * Clean Domain: Extracts the root domain for technical use (Emails/CORS).
 * Example: "https://www.biobrain.in/quiz" -> "biobrain.in"
 */
const getCleanDomain = () => {
  try {
    const hostname = getNormalDomain(process.env.BASE_URI);
    // Uses regex to strip "www." only if it exists at the start
    return hostname.replace(/^www\./, '');
  } catch (error) {
    return "biobrain.xyz"; // Fallback
  }
};

module.exports = { getNormalDomain, getCleanDomain }; // Export the functions as a modulelogger;