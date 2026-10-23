export function getErrorMessage(error) {
  if (error?.data?.error?.message) return error.data.error.message;
  if (error?.status === "FETCH_ERROR") return "Can't reach the server. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}

// Maps server details [{field, issue}] back onto react-hook-form fields
export function applyServerErrors(error, setError) {
  const details = error?.data?.error?.details;
  if (!Array.isArray(details)) return;
  details.forEach((d) => d.field && setError(d.field, { type: "server", message: d.issue }));
}

export const getErrorCode = (error) => error?.data?.error?.code;
