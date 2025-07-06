import React, { useState } from 'react';
import { Send, Mail, AlertCircle } from 'lucide-react';

const TransferForm = ({ selectedFile, onTransfer, isTransferring }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(true);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setRecipientEmail(email);
    setIsValidEmail(email === '' || validateEmail(email));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFile && recipientEmail && isValidEmail) {
      onTransfer(recipientEmail);
    }
  };

  const canTransfer = selectedFile && recipientEmail && isValidEmail && !isTransferring;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Transfer Details</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                id="recipient"
                value={recipientEmail}
                onChange={handleEmailChange}
                placeholder="Enter recipient's email address"
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                  isValidEmail
                    ? 'border-gray-200 focus:ring-blue-500 focus:border-transparent'
                    : 'border-red-300 focus:ring-red-500 focus:border-transparent'
                }`}
                required
              />
            </div>
            {!isValidEmail && (
              <div className="flex items-center space-x-2 mt-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Please enter a valid email address</span>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Selected File</h4>
              <p className="text-sm text-gray-600">{selectedFile.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!canTransfer}
        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-200 ${
          canTransfer
            ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 transform hover:scale-[1.02] shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Send className="w-5 h-5" />
        <span>{isTransferring ? 'Transferring...' : 'Start Transfer'}</span>
      </button>
    </form>
  );
};

export default TransferForm;