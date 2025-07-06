import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FileTransferService } from '../../services/fileTransferService';
import Header from './Header';
import FileUpload from './FileUpload';
import TransferForm from './TransferForm';
import ProgressIndicator from './ProgressIndicator';
import TransferHistory from './TransferHistory';
import ReceivedFiles from './ReceivedFiles';
import { Send, Inbox, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentTransfer, setCurrentTransfer] = useState(null);
  const [transferHistory, setTransferHistory] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [activeTab, setActiveTab] = useState('send');
  const [error, setError] = useState('');

  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile) {
      console.log('Dashboard loaded for user:', profile.email);
      loadTransfers();
    }
  }, [user, profile]);

  const loadTransfers = async () => {
    if (!user || !profile) {
      console.log('Cannot load transfers: missing user or profile');
      return;
    }

    try {
      console.log('Loading transfers...');
      const [sentTransfers, receivedTransfers] = await Promise.all([
        FileTransferService.getUserTransfers(user.id),
        FileTransferService.getReceivedTransfers(profile.email),
      ]);

      console.log('Transfers loaded:', { sent: sentTransfers.length, received: receivedTransfers.length });
      setTransferHistory(sentTransfers);
      setReceivedFiles(receivedTransfers);
    } catch (error) {
      console.error('Error loading transfers:', error);
      setError('Failed to load transfers');
    }
  };

  const handleFileSelect = (file) => {
    console.log('File selected:', file.name, file.size);
    setSelectedFile(file);
    setCurrentTransfer(null);
    setError('');
  };

  const handleTransfer = async (recipientEmail) => {
    if (!selectedFile || !user) {
      console.error('Cannot transfer: missing file or user');
      return;
    }

    console.log('Starting transfer to:', recipientEmail);
    setIsTransferring(true);
    setError('');
    
    // Create a temporary transfer object for UI
    const tempTransfer = {
      id: 'temp-' + Date.now(),
      sender_id: user.id,
      recipient_email: recipientEmail,
      file_name: selectedFile.name,
      file_size: selectedFile.size,
      file_type: selectedFile.type,
      progress: 0,
      status: 'uploading',
      transfer_code: '',
      expires_at: '',
      created_at: new Date().toISOString(),
    };

    setCurrentTransfer(tempTransfer);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setCurrentTransfer(prev => {
        if (!prev) return null;
        const newProgress = Math.min(prev.progress + Math.random() * 15 + 5, 90);
        return {
          ...prev,
          progress: newProgress,
          status: newProgress < 50 ? 'uploading' : 'transferring',
        };
      });
    }, 300);

    try {
      const result = await FileTransferService.createTransfer(
        recipientEmail,
        selectedFile.name,
        selectedFile.size,
        selectedFile.type,
        selectedFile
      );

      clearInterval(progressInterval);

      if (result.success && result.transfer) {
        console.log('Transfer completed successfully');
        setCurrentTransfer({
          ...result.transfer,
          progress: 100,
          status: 'completed',
        });

        // Add to transfer history
        setTransferHistory(prev => [result.transfer, ...prev]);

        // Clear after delay
        setTimeout(() => {
          setCurrentTransfer(null);
          setSelectedFile(null);
        }, 3000);
      } else {
        console.error('Transfer failed:', result.error);
        setCurrentTransfer(prev => prev ? {
          ...prev,
          status: 'failed',
        } : null);
        setError(result.error || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer exception:', error);
      clearInterval(progressInterval);
      setCurrentTransfer(prev => prev ? {
        ...prev,
        status: 'failed',
      } : null);
      setError('An unexpected error occurred during transfer');
    } finally {
      setIsTransferring(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Account Setup Required</h2>
          <p className="text-gray-600">Please refresh the page to complete your account setup.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-white/20 inline-flex">
            <button
              onClick={() => setActiveTab('send')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'send'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Send Files</span>
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'received'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Received Files ({receivedFiles.length})</span>
            </button>
          </div>
        </div>

        {activeTab === 'send' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - File Upload & Transfer */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Send Files</h2>
                <FileUpload onFileSelect={handleFileSelect} />
              </div>

              {selectedFile && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                  <TransferForm
                    selectedFile={selectedFile}
                    onTransfer={handleTransfer}
                    isTransferring={isTransferring}
                  />
                </div>
              )}
            </div>

            {/* Right Column - Progress & History */}
            <div className="space-y-6">
              {currentTransfer && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Transfer Progress</h2>
                  <ProgressIndicator
                    progress={currentTransfer.progress}
                    status={currentTransfer.status}
                    fileName={currentTransfer.file_name}
                    fileSize={currentTransfer.file_size}
                  />
                </div>
              )}

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <TransferHistory transfers={transferHistory} />
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <ReceivedFiles transfers={receivedFiles} onRefresh={loadTransfers} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;