// app/validation-messages/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  validationMessages, 
  passwordRules, 
  disposableDomains,
  ValidationRule 
} from "@/config/validation.config";
import { validationService } from "@/services/validation.service";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Mail,
  Lock,
  Edit,
  Save,
  RefreshCw
} from "lucide-react";

export default function ValidationMessagesPage() {
  const [activeTab, setActiveTab] = useState<'email' | 'password' | 'general' | 'domains'>('email');
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [testResults, setTestResults] = useState<{
    emailValid?: boolean;
    emailErrors?: string[];
    passwordValid?: boolean;
    passwordErrors?: string[];
  }>({});
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState('');

  const handleTestEmail = () => {
    const result = validationService.validateEmail(testEmail);
    setTestResults({
      emailValid: result.isValid,
      emailErrors: result.errors,
    });
  };

  const handleTestPassword = () => {
    const result = validationService.validatePassword(testPassword);
    setTestResults({
      passwordValid: result.isValid,
      passwordErrors: result.errors,
    });
  };

  const handleEditMessage = (key: string, value: string) => {
    setEditingMessage(key);
    setEditedValue(value);
  };

  const handleSaveMessage = (key: string) => {
    // In a real app, you would save this to a database/backend
    console.log(`Saving message for ${key}: ${editedValue}`);
    setEditingMessage(null);
    // Show success toast
  };

  const getValidationStatus = (valid?: boolean) => {
    if (valid === undefined) return null;
    return valid ? (
      <CheckCircle2 className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Validation Messages Configuration</h1>
          <p className="text-gray-500 mt-1">Manage all validation rules and messages for the login system</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'email', label: 'Email Validation', icon: Mail },
                { id: 'password', label: 'Password Validation', icon: Lock },
                { id: 'general', label: 'General Messages' },
                { id: 'domains', label: 'Blocked Domains' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon && <tab.icon className="w-4 h-4" />}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Email Validation Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Test Email Validation</h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email to test..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleTestEmail}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Test
                  </button>
                </div>
                {testResults.emailValid !== undefined && (
                  <div className="mt-3 flex items-center gap-2">
                    {getValidationStatus(testResults.emailValid)}
                    <span className="text-sm">
                      {testResults.emailValid ? 'Valid email address' : 'Invalid email address'}
                    </span>
                  </div>
                )}
                {testResults.emailErrors && testResults.emailErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {testResults.emailErrors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600">• {error}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Email Validation Messages</h3>
                {Object.entries(validationMessages.email).map(([key, message]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="text-xs font-mono text-gray-500">{key}</span>
                      {editingMessage === `email.${key}` ? (
                        <input
                          type="text"
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)}
                          className="w-full mt-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-sm text-gray-700 mt-0.5">{message}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {editingMessage === `email.${key}` ? (
                        <>
                          <button
                            onClick={() => handleSaveMessage(`email.${key}`)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingMessage(null)}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditMessage(`email.${key}`, message)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Password Validation Tab */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Test Password Validation</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    placeholder="Enter password to test..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleTestPassword}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Test
                  </button>
                </div>
                {testPassword && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      {getValidationStatus(testResults.passwordValid)}
                      <span className="text-sm font-medium">
                        {testResults.passwordValid ? 'Valid password' : 'Invalid password'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {passwordRules.map((rule) => {
                        const met = rule.test(testPassword);
                        return (
                          <div key={rule.id} className="flex items-center gap-2 text-sm">
                            {met ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span className={met ? 'text-green-600' : 'text-red-500'}>
                              {rule.message}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Password Validation Messages</h3>
                {Object.entries(validationMessages.password).map(([key, message]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="text-xs font-mono text-gray-500">{key}</span>
                      {editingMessage === `password.${key}` ? (
                        <input
                          type="text"
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)}
                          className="w-full mt-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-sm text-gray-700 mt-0.5">{message}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {editingMessage === `password.${key}` ? (
                        <>
                          <button
                            onClick={() => handleSaveMessage(`password.${key}`)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingMessage(null)}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditMessage(`password.${key}`, message)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Messages Tab */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">General Validation Messages</h3>
              {Object.entries(validationMessages.general).map(([key, message]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <span className="text-xs font-mono text-gray-500">{key}</span>
                    {editingMessage === `general.${key}` ? (
                      <input
                        type="text"
                        value={editedValue}
                        onChange={(e) => setEditedValue(e.target.value)}
                        className="w-full mt-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 mt-0.5">{message}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {editingMessage === `general.${key}` ? (
                      <>
                        <button
                          onClick={() => handleSaveMessage(`general.${key}`)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingMessage(null)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEditMessage(`general.${key}`, message)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Blocked Domains Tab */}
          {activeTab === 'domains' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">Blocked Temporary Email Domains</h3>
                <span className="text-sm text-gray-500">{disposableDomains.length} domains blocked</span>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-700 font-medium">Temporary email domains blocked</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      These domains are commonly used for disposable email addresses and are not allowed for registration.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {disposableDomains.map((domain, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                    <XCircle className="w-3 h-3 text-red-400" />
                    <span className="font-mono text-gray-700">{domain}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="text-2xl font-bold text-gray-900">5</div>
            <div className="text-sm text-gray-500">Email Validation Rules</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="text-2xl font-bold text-gray-900">6</div>
            <div className="text-sm text-gray-500">Password Validation Rules</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="text-2xl font-bold text-gray-900">{disposableDomains.length}</div>
            <div className="text-sm text-gray-500">Blocked Email Domains</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="text-2xl font-bold text-gray-900">100%</div>
            <div className="text-sm text-gray-500">Validation Coverage</div>
          </div>
        </div>
      </div>
    </div>
  );
}