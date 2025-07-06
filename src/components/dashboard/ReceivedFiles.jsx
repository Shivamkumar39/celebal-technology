import React from 'react';
import { Download, Mail, Calendar, FileText, Image, Video, Music, File, User, Clock } from 'lucide-react';
import { FileTransferService } from '../../services/fileTransferService';

const ReceivedFiles = ({ transfers, onRefresh }) => {
  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (fileType.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (fileType.startsWith('audio/')) return <Music className="w-6 h-6" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  const handleDownload = async (transfer) => {
    try {
      const result = await FileTransferService.downloadFile(transfer.id);
      if (result.success && result.url) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = result.url;
        link.download = transfer.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Failed to download file: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'uploading':
      case 'transferring':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Received Files</h2>
              <p className="text-sm text-gray-600">Files sent to your email address</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {transfers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No files received yet</h3>
            <p className="text-gray-500">Files sent to your email will appear here</p>
            <p className="text-sm text-gray-400 mt-1">Share your email with others to receive files</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="group bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* File Icon */}
                      <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                        {getFileIcon(transfer.file_type)}
                      </div>

                      {/* File Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-lg mb-2 truncate">
                          {transfer.file_name}
                        </h3>
                        
                        {/* Sender Information */}
                        <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              Sent by: {transfer.sender?.name || 'Unknown User'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-700">
                              {transfer.sender?.email || 'Unknown Email'}
                            </span>
                          </div>
                        </div>

                        {/* File Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(transfer.created_at)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <File className="w-4 h-4" />
                            <span>{formatFileSize(transfer.file_size)}</span>
                          </div>
                          {transfer.completed_at && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Completed: {formatDate(transfer.completed_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end space-y-3 ml-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(transfer.status)}`}
                      >
                        {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                      </span>
                      
                      {transfer.status === 'completed' && transfer.file_url && (
                        <button
                          onClick={() => handleDownload(transfer)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg group-hover:shadow-xl"
                        >
                          <Download className="w-4 h-4" />
                          <span className="font-medium">Download</span>
                        </button>
                      )}

                      {transfer.status === 'failed' && (
                        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          Transfer failed
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transfer Code (for reference) */}
                  {transfer.transfer_code && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Transfer Code: {transfer.transfer_code}</span>
                        {transfer.expires_at && (
                          <span>Expires: {formatDate(transfer.expires_at)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivedFiles;