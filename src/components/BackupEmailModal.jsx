import React, { useState, useEffect } from "react";

export default function BackupEmailModal({ isOpen, onClose, initialEmail, onSave, onSendOtp }) {
  const [emailInput, setEmailInput] = useState(initialEmail || "");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setEmailInput(initialEmail || "");
    setOtpSent(false);
    setOtp("");
    setMessage("");
    setError("");
  }, [initialEmail, isOpen]);

  async function handleSendOtp() {
    setOtpLoading(true);
    setError("");
    setMessage("");
    try {
      await onSendOtp(emailInput);
      setMessage(`OTP sent to ${emailInput}`);
      setOtpSent(true);
    } catch (err) {
      setError("Failed to send OTP");
      console.error(err);
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleSave() {
    if (!otpSent) {
      setError("Please send OTP first.");
      return;
    }
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave(emailInput, otp);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to verify OTP and save backup email");
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Backup Email</h2>

        <input
          type="email"
          className="border border-gray-300 rounded p-2 w-full mb-2"
          placeholder="Enter backup email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          disabled={otpSent}
        />

        <button
          type="button"
          onClick={handleSendOtp}
          disabled={otpLoading || otpSent || !emailInput}
          className="bg-blue-600 text-white font-semibold rounded w-full py-2 mb-4 hover:bg-blue-700 transition disabled:opacity-50"
        >
          {otpLoading ? "Sending OTP..." : otpSent ? "OTP Sent" : "Send OTP"}
        </button>

        {otpSent && (
          <input
            type="text"
            placeholder="Enter OTP"
            className="border border-gray-300 rounded p-2 w-full mb-4 text-center"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
          />
        )}

        {error && <div className="text-red-600 mb-2">{error}</div>}
        {message && <div className="text-green-600 mb-2">{message}</div>}

        <div className="flex justify-end gap-4">
          <button
            className="bg-gray-400 px-4 py-2 rounded text-white"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 px-4 py-2 rounded text-white disabled:opacity-50"
            disabled={loading}
            onClick={handleSave}
          >
            {loading ? "Verifying..." : "Verify & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}