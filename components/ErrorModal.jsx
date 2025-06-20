/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ErrorModal = ({ isOpen, onClose, errorMessage, theme }) => {
  if (!isOpen) return null;

  const defaultMessage = "An unexpected error occurred. Please try again later.";

  const modalOverlayClasses = `fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;
  
  const modalBackgroundClasses = `absolute inset-0 transition-all duration-500
    ${theme === 'surprise' ? 'bg-black/20 backdrop-blur-xs' : 'bg-gray-800/30 backdrop-blur-sm'}`;

  const modalCardClasses = `relative rounded-2xl p-8 shadow-xl border max-w-md w-full mx-auto z-10 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) hover-lift
    ${theme === 'light' ? 'bg-white/95 backdrop-blur-sm border-gray-200/50 shadow-2xl' :
      theme === 'dark' ? 'bg-slate-800/95 backdrop-blur-sm border-slate-700/50 shadow-2xl' :
      'bg-white/80 backdrop-blur-lg border-white/40 shadow-2xl' // surprise
    }`;
  
  const closeButtonClasses = `absolute top-4 right-4 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) hover-lift
    ${theme === 'light' ? 'text-gray-400 hover:text-gray-600 hover:neon-glow-blue' :
      theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:neon-glow-blue' :
      'text-gray-500 hover:text-gray-700 hover:neon-glow-blue' // surprise
    }`;

  const titleClasses = `text-xl font-bold transition-all duration-300
    ${theme === 'light' ? 'text-gray-900' :
      theme === 'dark' ? 'text-slate-100' :
      'text-gray-900' // surprise
    }`;

  const messageTextClasses = `mb-4 transition-all duration-300
    ${theme === 'light' ? 'text-gray-600' :
      theme === 'dark' ? 'text-slate-300' :
      'text-gray-700' // surprise
    }`;
  
  const smallTextClasses = `mb-6 text-sm transition-all duration-300
    ${theme === 'light' ? 'text-gray-600' :
      theme === 'dark' ? 'text-slate-300' :
      'text-gray-700' // surprise
    }`;

  const linkClasses = `underline transition-all duration-300 hover-lift
    ${theme === 'light' ? 'text-blue-600 hover:text-blue-800' :
      theme === 'dark' ? 'text-blue-400 hover:text-blue-300' :
      'text-blue-600 hover:text-blue-700' // surprise
    }`;
  
  const actionButtonClasses = `px-4 py-2 text-white rounded-lg transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) focus:outline-none focus:ring-2 focus:ring-opacity-50 hover-lift neon-glow-blue
    ${theme === 'light' ? 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500' :
      theme === 'dark' ? 'bg-slate-600 hover:bg-slate-500 focus:ring-slate-400' :
      'bg-gray-700 hover:bg-gray-800 focus:ring-gray-600' // surprise
    }`;


  return (
    <div className={`${modalOverlayClasses} fade-in`}>
      <div
        className={`${modalBackgroundClasses} scale-in`}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={-1} // Make it not focusable by tab, but clickable
        aria-label="Close modal"
      />

      <div className={`${modalCardClasses} bounce-in`} role="alertdialog" aria-modal="true" aria-labelledby="error-modal-title" aria-describedby="error-modal-description">
        <button
          type="button"
          onClick={onClose}
          className={closeButtonClasses}
          aria-label="Close error dialog"
        >
          <X size={24} className="transition-transform duration-300 hover:scale-110 hover:rotate-90" />
        </button>

        <div className="flex items-center mb-4 slide-in-left">
          <AlertTriangle size={24} className="text-red-500 mr-3 flex-shrink-0 transition-all duration-300 hover:scale-110 pulse-glow" />
          <h2 id="error-modal-title" className={titleClasses}>
            Error
          </h2>
        </div>

        <p id="error-modal-description" className={`${messageTextClasses} slide-in-right`}>
          {errorMessage || defaultMessage}
        </p>

        <p className={`${smallTextClasses} slide-in-bottom`}>
          If the issue persists, ensure your API key is correctly configured. You can obtain an API key from{' '}
          <a
            href="https://ai.google.dev"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClasses}
          >
            ai.google.dev
          </a>
          .
        </p>

        <div className="flex justify-end slide-in-bottom">
          <button
            type="button"
            onClick={onClose}
            className={actionButtonClasses}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
