/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {GoogleGenAI, GenerateContentResponse} from '@google/genai';
import {
  PlusSquare,
  Trash2,
  Sparkles,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Brush,
  CopyCheck,
  Image as ImageIcon,
  Upload,
  Moon,
  Sun,
  Mic,
  MicOff,
  Square,
  Volume2
} from 'lucide-react';
import React, {useCallback, useEffect, useState, useRef} from 'react';
import ErrorModal from './components/ErrorModal';
import Header from './components/Header';
import TypingEffect from './components/TypingEffect'; // Import TypingEffect
import ParticleEffect from './components/ParticleEffect'; // Import ParticleEffect

const MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

interface Note {
  id: string;
  title: string;
  content: string;
  images: NoteImage[];
  createdAt: number;
  updatedAt: number;
}

interface NoteImage {
  id: string;
  dataUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: number;
}

export type Theme = 'light' | 'dark' | 'surprise';
type GeminiActionType = 'summarize' | 'brainstorm' | 'beautify' | null;

// Speech Recognition interface
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [geminiResult, setGeminiResult] = useState<string | null>(null);
  const [geminiActionType, setGeminiActionType] = useState<GeminiActionType>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [theme, setTheme] = useState<Theme>('light');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentImages, setCurrentImages] = useState<NoteImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  
  // Enhanced speech recognition states
  const [continuousTranscription, setContinuousTranscription] = useState('');
  const [lastInsertedText, setLastInsertedText] = useState('');
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Add new state for better error handling
  const [restartAttempts, setRestartAttempts] = useState(0);
  const [maxRestartAttempts] = useState(5);
  const [restartTimer, setRestartTimer] = useState<NodeJS.Timeout | null>(null);

  // Add state for auto-restart indicator
  const [isAutoRestarting, setIsAutoRestarting] = useState(false);

  // Add state for continuous mode
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [continuousModeTranscription, setContinuousModeTranscription] = useState('');

  const generateRandomGradient = useCallback(() => {
    const randomAngle = Math.floor(Math.random() * 360);
    const c1 = `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`;
    const c2 = `hsl(${Math.floor(Math.random() * 360)}, 70%, 85%)`;
    const c3 = `hsl(${Math.floor(Math.random() * 360)}, 70%, 90%)`;
    return `linear-gradient(${randomAngle}deg, ${c1}, ${c2}, ${c3})`;
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('geminiNotesTheme') as Theme || 'light';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('geminiNotesTheme', theme);
    const rootHtml = document.documentElement;
    rootHtml.classList.remove('light', 'dark', 'surprise-theme');

    const appRootContainer = document.getElementById('app-root-container');

    if (theme === 'dark') {
      rootHtml.classList.add('dark');
    } else {
      rootHtml.classList.add('light');
    }

    if (appRootContainer) {
        appRootContainer.style.backgroundImage = '';
        if (theme === 'surprise') {
            rootHtml.classList.add('surprise-theme');
            appRootContainer.style.backgroundImage = generateRandomGradient();
            appRootContainer.style.backgroundAttachment = 'fixed';
        }
    }
  }, [theme, generateRandomGradient]);

  useEffect(() => {
    const savedNotes = localStorage.getItem('geminiNotes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        // Ensure all notes have the images property for backward compatibility
        const notesWithImages = parsedNotes.map((note: any) => ({
          ...note,
          images: note.images || []
        }));
        setNotes(notesWithImages);
      } catch (error) {
        console.error('Error loading notes from localStorage:', error);
        setNotes([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('geminiNotes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (selectedNoteId) {
      const selectedNote = notes.find((note) => note.id === selectedNoteId);
      if (selectedNote) {
        setCurrentTitle(selectedNote.title);
        setCurrentContent(selectedNote.content);
        setCurrentImages(selectedNote.images);
        setGeminiResult(null); 
        setGeminiActionType(null); 
      } else {
        setSelectedNoteId(null);
        setCurrentTitle('');
        setCurrentContent('');
        setCurrentImages([]);
        setGeminiResult(null);
        setGeminiActionType(null);
      }
    } else {
      setCurrentTitle('');
      setCurrentContent('');
      setCurrentImages([]);
      setGeminiResult(null);
      setGeminiActionType(null);
    }
  }, [selectedNoteId, notes]);

  const handleShowError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      images: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prevNotes) => [newNote, ...prevNotes]);
    setSelectedNoteId(newNote.id);
    setCurrentTitle(newNote.title);
    setCurrentContent(newNote.content);
    setCurrentImages([]);
    setGeminiResult(null);
    setGeminiActionType(null);
  };

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
  };

  const updateNote = (id: string, title: string, content: string, images: NoteImage[] = []) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? {...note, title, content, images, updatedAt: Date.now()} : note,
      )
    );
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTitle(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentContent(e.target.value);
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [currentContent]);

  // Cleanup audio resources on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [audioUrl, silenceTimer, autoSaveTimer]);

  // Cleanup when switching notes
  useEffect(() => {
    if (isRecording) {
      stopRecording();
    }
    if (isListening) {
      stopSpeechRecognition();
    }
    if (isContinuousMode) {
      stopContinuousMode();
    }
    clearAudioData();
    setContinuousTranscription('');
    setLastInsertedText('');
    setContinuousModeTranscription('');
  }, [selectedNoteId]);

  const handleSaveNote = () => {
    if (selectedNoteId) {
      updateNote(selectedNoteId, currentTitle, currentContent, currentImages);
    }
  };

  // Image upload functionality
  const processImageFile = (file: File): Promise<NoteImage> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File must be an image'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Image size must be less than 5MB'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          dataUrl,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: Date.now(),
        });
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const imagePromises = Array.from(files).map(processImageFile);
      const newImages = await Promise.all(imagePromises);
      
      // Update current images state
      setCurrentImages(prev => {
        const updatedImages = [...prev, ...newImages];
        
        // Save to note immediately with the updated images
        if (selectedNoteId) {
          updateNote(selectedNoteId, currentTitle, currentContent, updatedImages);
        }
        
        return updatedImages;
      });
    } catch (error) {
      handleShowError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleImageUpload(e.dataTransfer.files);
  };

  const removeImage = (imageId: string) => {
    setCurrentImages(prev => {
      const updatedImages = prev.filter(img => img.id !== imageId);
      // Save to note immediately with the updated images
      if (selectedNoteId) {
        updateNote(selectedNoteId, currentTitle, currentContent, updatedImages);
      }
      return updatedImages;
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      setRecordingError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // Enhanced speech recognition with better error handling
  const startSpeechRecognition = () => {
    try {
      setRecordingError(null);
      setRestartAttempts(0);
      
      // Check if speech recognition is supported
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setRecordingError('Speech recognition is not supported in this browser.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript + interimTranscript;
        setTranscription(currentTranscript);
        
        // Handle continuous transcription with faster response
        if (finalTranscript.trim()) {
          setContinuousTranscription(prev => {
            const newTranscript = prev + finalTranscript;
            
            // Clear any existing silence timer
            if (silenceTimer) {
              clearTimeout(silenceTimer);
            }
            
            // Faster insertion: 0.8 seconds of silence triggers insertion
            const newSilenceTimer = setTimeout(() => {
              if (newTranscript.trim() && newTranscript !== lastInsertedText) {
                insertContinuousTranscription(newTranscript);
              }
            }, 800);
            
            setSilenceTimer(newSilenceTimer);
            return newTranscript;
          });
        }
        
        // Also insert on sentence endings (periods, exclamation marks, question marks)
        if (finalTranscript.trim() && (
          finalTranscript.endsWith('.') || 
          finalTranscript.endsWith('!') || 
          finalTranscript.endsWith('?') ||
          finalTranscript.endsWith('\n')
        )) {
          setTimeout(() => {
            if (continuousTranscription.trim() && continuousTranscription !== lastInsertedText) {
              insertContinuousTranscription(continuousTranscription);
            }
          }, 100);
        }
        
        // Insert on natural speech pauses
        if (finalTranscript.trim() && (
          finalTranscript.endsWith(',') ||
          finalTranscript.endsWith(' and ') ||
          finalTranscript.endsWith(' but ') ||
          finalTranscript.endsWith(' however ') ||
          finalTranscript.endsWith(' therefore ') ||
          finalTranscript.endsWith(' so ') ||
          finalTranscript.endsWith(' then ')
        )) {
          setTimeout(() => {
            if (continuousTranscription.trim() && continuousTranscription !== lastInsertedText) {
              insertContinuousTranscription(continuousTranscription);
            }
          }, 200);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle different error types
        switch (event.error) {
          case 'no-speech':
            // This is normal, just restart
            break;
          case 'audio-capture':
            setRecordingError('Microphone access denied. Please check permissions.');
            setIsListening(false);
            break;
          case 'not-allowed':
            setRecordingError('Microphone access denied. Please allow microphone access.');
            setIsListening(false);
            break;
          case 'network':
            setRecordingError('Network error. Please check your internet connection.');
            setIsListening(false);
            break;
          case 'service-not-allowed':
            setRecordingError('Speech recognition service not available.');
            setIsListening(false);
            break;
          case 'aborted':
            // User manually stopped, don't restart
            setIsListening(false);
            break;
          default:
            // For other errors, try to restart
            console.log('Attempting to restart speech recognition after error:', event.error);
            break;
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended, attempting restart...');
        
        // Auto-restart if we're still supposed to be listening
        if (isListening && restartAttempts < maxRestartAttempts) {
          setRestartAttempts(prev => prev + 1);
          
          // Exponential backoff for restart attempts
          const delay = Math.min(1000 * Math.pow(2, restartAttempts), 10000);
          
          const newRestartTimer = setTimeout(() => {
            if (isListening && recognitionRef.current) {
              try {
                console.log(`Restarting speech recognition (attempt ${restartAttempts + 1}/${maxRestartAttempts})...`);
                recognitionRef.current.start();
              } catch (error) {
                console.error('Failed to restart speech recognition:', error);
                // Try one more time after a longer delay
                setTimeout(() => {
                  if (isListening && recognitionRef.current) {
                    try {
                      recognitionRef.current.start();
                    } catch (retryError) {
                      console.error('Final restart attempt failed:', retryError);
                      setRecordingError('Speech recognition failed to restart. Please try again.');
                      setIsListening(false);
                    }
                  }
                }, 2000);
              }
            }
          }, delay);
          
          setRestartTimer(newRestartTimer);
        } else if (restartAttempts >= maxRestartAttempts) {
          setRecordingError('Speech recognition stopped after multiple restart attempts. Please try again.');
          setIsListening(false);
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
      setIsListening(true);
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setRecordingError('Failed to start speech recognition.');
    }
  };

  // Enhanced stop function
  const stopSpeechRecognition = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setRestartAttempts(0);
      
      // Clear restart timer
      if (restartTimer) {
        clearTimeout(restartTimer);
        setRestartTimer(null);
      }
    }
  };

  const insertTranscription = () => {
    if (transcription.trim()) {
      const currentPosition = textareaRef.current?.selectionStart || 0;
      const textBefore = currentContent.substring(0, currentPosition);
      const textAfter = currentContent.substring(currentPosition);
      const newContent = textBefore + transcription + textAfter;
      
      setCurrentContent(newContent);
      setTranscription('');
      
      // Auto-save after inserting text
      if (selectedNoteId) {
        updateNote(selectedNoteId, currentTitle, newContent, currentImages);
      }
      
      // Focus back to textarea and set cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = currentPosition + transcription.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
      
      // Auto-restart speech recognition after 1 second
      setTimeout(() => {
        if (!isListening) {
          console.log('Auto-restarting speech recognition after text insertion...');
          startSpeechRecognition();
        }
      }, 1000);
    }
  };

  const insertContinuousTranscription = (text: string) => {
    if (text.trim() && text !== lastInsertedText) {
      const currentPosition = textareaRef.current?.selectionStart || 0;
      const textBefore = currentContent.substring(0, currentPosition);
      const textAfter = currentContent.substring(currentPosition);
      
      // Add proper spacing and punctuation
      let textToInsert = text.trim();
      if (textBefore && !textBefore.endsWith(' ') && !textBefore.endsWith('\n')) {
        textToInsert = ' ' + textToInsert;
      }
      if (!textToInsert.endsWith('.') && !textToInsert.endsWith('!') && !textToInsert.endsWith('?') && !textToInsert.endsWith('\n')) {
        textToInsert += '. ';
      } else if (!textToInsert.endsWith(' ') && !textToInsert.endsWith('\n')) {
        textToInsert += ' ';
      }
      
      const newContent = textBefore + textToInsert + textAfter;
      setCurrentContent(newContent);
      setLastInsertedText(text);
      setContinuousTranscription('');
      
      // Auto-save after inserting text
      if (selectedNoteId) {
        // Clear any existing auto-save timer
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer);
        }
        
        // Faster auto-save: 300ms delay instead of 1000ms
        const newAutoSaveTimer = setTimeout(() => {
          updateNote(selectedNoteId, currentTitle, newContent, currentImages);
        }, 300); // Reduced from 1000ms to 300ms
        
        setAutoSaveTimer(newAutoSaveTimer);
      }
      
      // Focus back to textarea and set cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = currentPosition + textToInsert.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const clearAudioData = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription('');
    setContinuousTranscription('');
    setLastInsertedText('');
    setRecordingTime(0);
    
    // Clear timers
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      setAutoSaveTimer(null);
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const handleDeleteNote = (id: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
      setCurrentTitle('');
      setCurrentContent('');
      setCurrentImages([]);
      setGeminiResult(null);
      setGeminiActionType(null);
    }
  };

  const callGemini = async (prompt: string, actionType: GeminiActionType) => {
    if (!selectedNoteId) return;
    setIsLoadingGemini(true);
    setGeminiActionType(actionType); // Set action type before the call
    setGeminiResult(''); // Clear previous result and ensure TypingEffect reruns
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
      setGeminiResult(response.text || '');
    } catch (error: unknown) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      handleShowError(
        `Failed to generate content: ${errorMessage}. Please check your API key and network connection.`,
      );
      setGeminiResult(null); // Clear result on error
      // Keep geminiActionType to show the context of the error if needed, or clear it:
      // setGeminiActionType(null); 
    } finally {
      setIsLoadingGemini(false);
    }
  };

  const handleSummarize = () => {
    if (!currentContent.trim()) {
      handleShowError('Note content is empty. Cannot summarize.');
      return;
    }
    const prompt = `Summarize the following note concisely:\n\nTitle: ${currentTitle}\n\nContent:\n${currentContent}`;
    callGemini(prompt, 'summarize');
  };

  const handleBrainstorm = () => {
    if (!currentContent.trim()) {
      handleShowError('Note content is empty. Cannot brainstorm.');
      return;
    }
    const prompt = `Based on the following note, generate 3-5 related ideas, action items, or discussion points:\n\nTitle: ${currentTitle}\n\nContent:\n${currentContent}`;
    callGemini(prompt, 'brainstorm');
  };

  const handleBeautify = () => {
    if (!currentContent.trim()) {
      handleShowError('Note content is empty. Cannot beautify.');
      return;
    }
    const prompt = `Your task is to "beautify" the following note. Please perform these actions:
1.  **Paraphrase**: Rewrite the entire note content to improve its clarity, flow, and overall readability. Aim for a slightly more polished or professional tone, depending on the context if discernible, otherwise a generally clear and engaging tone.
2.  **Bullet Points**: Extract the key information or actions from the original note and present them as a concise list of bullet points.

Please structure your response clearly with two distinct sections. Use the following Markdown headings:

### Paraphrased Version:
[Your paraphrased text here]

### Key Bullet Points:
[Your bullet points here, e.g., - Point 1\\n- Point 2]

---
Original Note Title: ${currentTitle}
Original Note Content:
${currentContent}
---
`;
    callGemini(prompt, 'beautify');
  };

  const handleReplaceWithBeautifiedContent = () => {
    if (selectedNoteId && geminiResult && geminiActionType === 'beautify') {
      setCurrentContent(geminiResult); 
      updateNote(selectedNoteId, currentTitle, geminiResult, currentImages); 
      // Do not clear geminiActionType here, so the "Replace" button doesn't immediately disappear after clicking.
      // It will naturally disappear if another Gemini action is taken or the note changes.
      // Or, set a new state like `beautifyApplied = true` if more specific control is needed.
      // For now, let it persist. The user might want to copy parts of it even after replacing.
    }
  };

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  const sidebarClasses = `w-1/4 min-w-[280px] max-w-[350px] flex flex-col p-4 space-y-4 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) backdrop-blur-md
    ${theme === 'light' ? 'bg-gray-100/90 backdrop-blur-sm border-r border-gray-200/50 shadow-lg' :
      theme === 'dark' ? 'bg-slate-800/90 backdrop-blur-sm border-r border-slate-700/50 shadow-lg' :
      'bg-white/60 backdrop-blur-md border-r border-white/30 shadow-xl'
    }`;

  const noteItemBaseClasses = "p-4 rounded-xl cursor-pointer group transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) focus:outline-none focus:ring-2 hover-lift border backdrop-blur-sm relative overflow-hidden";
  const noteItemTextTitle = theme === 'surprise' ? 'text-gray-800' : 'text-gray-800 dark:text-slate-200';
  const noteItemTextContent = theme === 'surprise' ? 'text-gray-600' : 'text-gray-500 dark:text-slate-400';
  const noteItemTextDate = theme === 'surprise' ? 'text-gray-500' : 'text-gray-400 dark:text-slate-500';

  const mainContentClasses = `flex-1 flex flex-col p-6 overflow-y-auto transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
    ${theme === 'light' ? 'bg-white/90 backdrop-blur-sm' :
      theme === 'dark' ? 'bg-slate-850/90 backdrop-blur-sm' : 
      'bg-white/50 backdrop-blur-md shadow-lg'
    }`;

  const inputTitleClasses = `text-2xl font-bold mb-4 p-2 border-b-2 outline-none transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) hover-lift
    ${theme === 'light' ? 'text-gray-800 border-gray-200 focus:border-blue-500 focus:neon-glow-blue' :
      theme === 'dark' ? 'bg-slate-850 text-slate-100 border-slate-600 focus:border-blue-400 focus:neon-glow-blue placeholder-slate-400' :
      'bg-transparent text-gray-800 border-black/20 focus:border-blue-500/70 focus:neon-glow-blue placeholder-gray-600'
    }`;
  
  const textareaClasses = `min-h-[300px] w-full p-3 rounded-lg border outline-none resize-y leading-relaxed transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) hover-lift overflow-y-auto
    ${theme === 'light' ? 'text-gray-700 bg-gray-50/80 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:neon-glow-blue' :
      theme === 'dark' ? 'bg-slate-700/80 text-slate-200 border-slate-600 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:neon-glow-blue placeholder-slate-400' :
      'bg-white/60 text-gray-800 border-black/20 focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 focus:neon-glow-blue placeholder-gray-500 backdrop-blur-xs'
    }`;

  const geminiResultBoxClasses = `mt-4 p-4 border rounded-lg transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) hover-lift scale-in
    ${theme === 'light' ? 'bg-blue-50/90 backdrop-blur-sm border-blue-200/50 shadow-lg' :
      theme === 'dark' ? 'bg-slate-700/50 backdrop-blur-sm border-blue-800/50 shadow-lg' : 
      'bg-blue-300/30 backdrop-blur-sm border-blue-400/50 shadow-lg'
    }`;
  const geminiResultTitleClasses = `font-semibold mb-2 flex items-center gap-2 transition-all duration-300
    ${theme === 'light' ? 'text-blue-700' :
      theme === 'dark' ? 'text-blue-300' : 
      'text-blue-800'
    }`;
  
  const replaceButtonClasses = `mt-3 flex items-center gap-2 px-3 py-1.5 text-xs text-white rounded-md transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) hover-lift neon-glow-green
    ${theme === 'surprise' ? 'bg-emerald-500/80 hover:bg-emerald-600/90 disabled:bg-gray-400/70' : 
      theme === 'dark' ? 'bg-green-600 hover:bg-green-500 disabled:bg-slate-600 dark:text-slate-900' : 
      'bg-green-500 hover:bg-green-600 disabled:bg-gray-300'
    }`;

  const getGeminiResultTitle = () => {
    if (!geminiActionType && !geminiResult) return null; // No title if no action/result
    if (isLoadingGemini && geminiActionType) {
        // Show title based on current action even while loading
        switch (geminiActionType) {
            case 'summarize': return "Gemini's Summary:";
            case 'brainstorm': return "Gemini's Ideas:";
            case 'beautify': return "Gemini's Beautified Note:";
            default: return "Gemini is thinking...";
        }
    }
    // If not loading, and there's a result, determine title
    // This part helps retain the title if user clicks away from "Beautify" replace button
    if (geminiResult) {
        if (geminiActionType === 'summarize' || (!geminiActionType && geminiResult.toLowerCase().includes("summary"))) return "Gemini's Summary:";
        if (geminiActionType === 'brainstorm' || (!geminiActionType && (geminiResult.toLowerCase().includes("ideas") || geminiResult.toLowerCase().includes("discussion points")))) return "Gemini's Ideas:";
        if (geminiActionType === 'beautify' || (!geminiActionType && (geminiResult.toLowerCase().includes("paraphrased version") || geminiResult.toLowerCase().includes("key bullet points")))) return "Gemini's Beautified Note:";
    }
    return "Gemini's Response:"; // Fallback
  };
  
  const currentGeminiTitle = getGeminiResultTitle();

  // Continuous mode speech recognition - never stops until manually turned off
  const startContinuousMode = () => {
    try {
      setRecordingError(null);
      
      // Check if speech recognition is supported
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setRecordingError('Speech recognition is not supported in this browser.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Show live transcription
        setContinuousModeTranscription(finalTranscript + interimTranscript);
        
        // Auto-insert final text immediately without any delays
        if (finalTranscript.trim()) {
          insertContinuousModeText(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Continuous mode error:', event.error);
        
        // Only show critical errors, otherwise keep going
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
          setRecordingError('Microphone access denied. Please allow microphone access.');
          setIsContinuousMode(false);
        }
        // For other errors, just log and continue
      };

      recognition.onend = () => {
        // Always restart if still in continuous mode
        if (isContinuousMode) {
          setTimeout(() => {
            if (isContinuousMode && recognitionRef.current) {
              try {
                console.log('Restarting continuous mode...');
                recognitionRef.current.start();
              } catch (error) {
                console.error('Failed to restart continuous mode:', error);
                // Try again after a short delay
                setTimeout(() => {
                  if (isContinuousMode && recognitionRef.current) {
                    try {
                      recognitionRef.current.start();
                    } catch (retryError) {
                      console.error('Final restart attempt failed:', retryError);
                      setRecordingError('Continuous mode failed to restart. Please try again.');
                      setIsContinuousMode(false);
                    }
                  }
                }, 1000);
              }
            }
          }, 100);
        } else {
          setIsContinuousMode(false);
        }
      };

      recognition.start();
      setIsContinuousMode(true);
      
    } catch (error) {
      console.error('Error starting continuous mode:', error);
      setRecordingError('Failed to start continuous mode.');
    }
  };

  // Stop continuous mode
  const stopContinuousMode = () => {
    if (recognitionRef.current && isContinuousMode) {
      recognitionRef.current.stop();
      setIsContinuousMode(false);
      setContinuousModeTranscription('');
    }
  };

  // Insert text for continuous mode (immediate insertion)
  const insertContinuousModeText = (text: string) => {
    if (text.trim()) {
      const currentPosition = textareaRef.current?.selectionStart || 0;
      const textBefore = currentContent.substring(0, currentPosition);
      const textAfter = currentContent.substring(currentPosition);
      
      // Add proper spacing
      let textToInsert = text.trim();
      if (textBefore && !textBefore.endsWith(' ') && !textBefore.endsWith('\n')) {
        textToInsert = ' ' + textToInsert;
      }
      if (!textToInsert.endsWith(' ') && !textToInsert.endsWith('\n')) {
        textToInsert += ' ';
      }
      
      const newContent = textBefore + textToInsert + textAfter;
      setCurrentContent(newContent);
      setContinuousModeTranscription('');
      
      // Auto-save
      if (selectedNoteId) {
        updateNote(selectedNoteId, currentTitle, newContent, currentImages);
      }
      
      // Focus back to textarea and set cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = currentPosition + textToInsert.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  return (
    <>
      <div id="app-root-container" className={`fixed inset-0 flex flex-col transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${theme === 'light' ? 'bg-gray-50' : theme === 'dark' ? 'bg-slate-900' : ''} ${theme === 'surprise' ? 'futuristic-gradient' : ''}`}>
        {theme === 'surprise' && <ParticleEffect />}
        <Header theme={theme} setTheme={setTheme} />
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          errorMessage={errorMessage}
          theme={theme}
        />
        <div className="flex flex-1 overflow-hidden">
          <div className={`${sidebarClasses} slide-in-left`}>
            <button
              type="button"
              onClick={handleAddNote}
              className={`w-full flex items-center justify-center gap-3 px-4 py-4 text-white rounded-xl transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) focus:outline-none focus:ring-2 focus:ring-opacity-50 hover-lift bounce-in font-semibold shadow-lg
                ${theme === 'surprise' ? 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-600/95 hover:to-blue-700/95 focus:ring-blue-500/70 neon-glow-blue' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 focus:ring-blue-500 dark:focus:ring-blue-300 neon-glow-blue'}
              `}
              aria-label="Create new note"
            >
              <PlusSquare size={20} className="transition-all duration-300 group-hover:rotate-90 group-hover:scale-110" />
              <span className="transition-all duration-300 group-hover:translate-x-1">New Note</span>
            </button>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {notes.length === 0 && (
                <div className="fade-in">
                  <p className={`text-sm text-center py-8 ${theme === 'surprise' ? 'text-gray-700' : 'text-gray-500 dark:text-slate-400'}`}>
                    No notes yet. Create one!
                  </p>
                </div>
              )}
              {notes.map((note, index) => {
                const isSelected = selectedNoteId === note.id;
                const noteItemClasses = `${noteItemBaseClasses}
                  ${isSelected ?
                    (theme === 'light' ? 'bg-gradient-to-br from-blue-50 to-blue-100/80 border-blue-200/50 shadow-lg shadow-blue-500/20 neon-glow-blue' :
                     theme === 'dark' ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/30 border-blue-600/50 shadow-lg shadow-blue-500/20 neon-glow-blue' :
                     'bg-gradient-to-br from-blue-400/30 to-blue-300/20 border-blue-400/50 backdrop-blur-md shadow-lg shadow-blue-500/20 neon-glow-blue') :
                    (theme === 'light' ? 'bg-white/80 hover:bg-white/90 border-gray-200/50 hover:border-gray-300/50 shadow-sm hover:shadow-md' :
                     theme === 'dark' ? 'bg-slate-700/80 hover:bg-slate-600/80 border-slate-600/50 hover:border-slate-500/50 shadow-sm hover:shadow-md' :
                     'bg-white/60 hover:bg-white/80 border-white/30 hover:border-white/40 backdrop-blur-md shadow-sm hover:shadow-md')
                  }
                  ${isSelected && theme === 'surprise' ? 'text-blue-900' : noteItemTextTitle}
                  focus:ring-blue-400 dark:focus:ring-blue-300
                `;

                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectNote(note.id)}
                    className={`${noteItemClasses} slide-in-left note-item-premium`}
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      '--note-index': index
                    } as React.CSSProperties}
                    role="button"
                    tabIndex={0}
                    aria-selected={isSelected}
                  >
                    {/* Subtle background animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                      <h3 className={`font-semibold text-sm truncate pr-2 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isSelected && theme === 'surprise' ? 'text-blue-900' : noteItemTextTitle}`}>
                        {note.title || 'Untitled Note'}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className={`opacity-0 group-hover:opacity-100 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) focus:outline-none hover:scale-110 transform hover:rotate-12
                          ${theme === 'surprise' ? 'text-red-600/80 hover:text-red-700 focus:text-red-700' : 'text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 focus:text-red-600 dark:focus:text-red-400'}
                        `}
                        aria-label={`Delete note titled ${note.title || 'Untitled Note'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className={`text-xs truncate mt-2 transition-all duration-300 leading-relaxed ${isSelected && theme === 'surprise' ? 'text-blue-800/90' : noteItemTextContent}`}>
                      {note.content.substring(0, 80) || 'No content...'}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/30 dark:border-slate-600/30">
                      <p className={`text-xs transition-all duration-300 ${isSelected && theme === 'surprise' ? 'text-blue-700/80' : noteItemTextDate}`}>
                        {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {note.images && note.images.length > 0 && (
                        <div className="flex items-center gap-1">
                          <ImageIcon size={12} className={`${theme === 'surprise' ? 'text-blue-600' : 'text-blue-500 dark:text-blue-400'}`} />
                          <span className={`text-xs ${theme === 'surprise' ? 'text-blue-600' : 'text-blue-500 dark:text-blue-400'}`}>
                            {note.images.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${mainContentClasses} slide-in-right`}>
            {selectedNoteId && selectedNote ? (
              <div className="fade-in">
                <input
                  type="text"
                  value={currentTitle}
                  onChange={handleTitleChange}
                  onBlur={handleSaveNote}
                  placeholder="Note Title"
                  className={inputTitleClasses}
                  aria-label="Note title"
                />
                <textarea
                  value={currentContent}
                  onChange={handleContentChange}
                  onBlur={handleSaveNote}
                  placeholder="Start writing your note... (You can resize this textarea by dragging the bottom edge)"
                  className={textareaClasses}
                  aria-label="Note content"
                  ref={textareaRef}
                  style={{ 
                    minHeight: '300px',
                    maxHeight: '70vh',
                    resize: 'vertical'
                  }}
                />

                {/* Image Upload Area */}
                <div className="mt-4">
                  <div
                    className={`image-upload-area border-2 border-dashed rounded-lg p-4 transition-all duration-300 cursor-pointer hover-lift
                      ${isDragOver 
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 drag-over' 
                        : theme === 'light' 
                          ? 'border-gray-300 hover:border-blue-400' 
                          : theme === 'dark' 
                            ? 'border-slate-600 hover:border-blue-400' 
                            : 'border-gray-400 hover:border-blue-500'
                      }
                      ${isUploading ? 'image-upload-loading' : ''}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      {isUploading ? (
                        <Loader2 size={24} className="animate-spin mb-2 text-blue-500" />
                      ) : (
                        <Upload size={24} className={`mb-2 ${theme === 'surprise' ? 'text-gray-600' : 'text-gray-400 dark:text-slate-500'}`} />
                      )}
                      <p className={`text-sm ${theme === 'surprise' ? 'text-gray-700' : 'text-gray-600 dark:text-slate-400'}`}>
                        {isUploading ? 'Uploading images...' : 'Drag & drop images here or click to upload'}
                      </p>
                      <p className={`text-xs mt-1 ${theme === 'surprise' ? 'text-gray-500' : 'text-gray-500 dark:text-slate-500'}`}>
                        Supports JPG, PNG, GIF (max 5MB each)
                      </p>
                    </div>
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="hidden"
                  />
                </div>

                {/* Image Gallery */}
                {currentImages.length > 0 && (
                  <div className="mt-4">
                    <h4 className={`text-sm font-semibold mb-3 ${theme === 'surprise' ? 'text-gray-800' : 'text-gray-700 dark:text-slate-300'}`}>
                      Images ({currentImages.length})
                    </h4>
                    <div className="image-gallery grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {currentImages.map((image) => (
                        <div
                          key={image.id}
                          className="image-item relative group rounded-lg overflow-hidden border transition-all duration-300 hover-lift"
                        >
                          <img
                            src={image.dataUrl}
                            alt={image.fileName}
                            className="w-full h-32 object-cover"
                            loading="lazy"
                          />
                          <div className="image-overlay">
                            <button
                              onClick={() => removeImage(image.id)}
                              className="image-remove-btn bg-red-500 text-white rounded-full p-1 transition-all duration-300 hover:bg-red-600"
                              title="Remove image"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="image-filename">
                            {image.fileName}
                          </div>
                          <div className="file-size absolute top-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                            {(image.fileSize / 1024 / 1024).toFixed(1)}MB
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audio Recording Section */}
                <div className="mt-6">
                  <h4 className={`text-sm font-semibold mb-3 ${theme === 'surprise' ? 'text-gray-800' : 'text-gray-700 dark:text-slate-300'}`}>
                    Voice & Audio
                  </h4>
                  
                  {/* Error Display */}
                  {recordingError && (
                    <div className={`mb-3 p-3 rounded-lg text-sm ${theme === 'surprise' ? 'bg-red-100/80 text-red-800 border border-red-200' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                      {recordingError}
                    </div>
                  )}

                  {/* Recording Controls */}
                  <div className="flex items-center gap-3 mb-4 flex-wrap audio-controls">
                    {/* Audio Recording Button */}


                    {/* Auto Voice Button */}
                    <button
                      type="button"
                      onClick={isListening ? stopSpeechRecognition : startSpeechRecognition}
                      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium text-white rounded-xl transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) hover-lift shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-opacity-50
                        ${isListening 
                          ? (theme === 'surprise' 
                              ? 'bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 hover:from-emerald-600/95 hover:to-emerald-700/95 focus:ring-emerald-500/70 shadow-emerald-500/25' 
                              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 dark:from-emerald-400 dark:to-emerald-500 dark:hover:from-emerald-500 dark:hover:to-emerald-600 focus:ring-emerald-500 dark:focus:ring-emerald-300 shadow-emerald-500/25')
                          : (theme === 'surprise' 
                              ? 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-600/95 hover:to-blue-700/95 focus:ring-blue-500/70 shadow-blue-500/25' 
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-400 dark:to-blue-500 dark:hover:from-blue-500 dark:hover:to-blue-600 focus:ring-blue-500 dark:focus:ring-blue-300 shadow-blue-500/25')
                        }`}
                      aria-label={isListening ? 'Stop automatic speech recognition' : 'Start automatic speech recognition'}
                    >
                      {isListening ? (
                        <>
                          <MicOff size={18} className="recording-indicator" />
                          Stop Auto Voice
                        </>
                      ) : (
                        <>
                          <Mic size={18} className="transition-transform duration-300 hover:scale-110" />
                          Auto Voice
                        </>
                      )}
                    </button>

                    {/* Continuous Mode Button */}
                    <button
                      type="button"
                      onClick={isContinuousMode ? stopContinuousMode : startContinuousMode}
                      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium text-white rounded-xl transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) hover-lift shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-opacity-50
                        ${isContinuousMode 
                          ? (theme === 'surprise' 
                              ? 'bg-gradient-to-r from-indigo-500/90 to-indigo-600/90 hover:from-indigo-600/95 hover:to-indigo-700/95 focus:ring-indigo-500/70 shadow-indigo-500/25' 
                              : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 dark:from-indigo-400 dark:to-indigo-500 dark:hover:from-indigo-500 dark:hover:to-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-300 shadow-indigo-500/25')
                          : (theme === 'surprise' 
                              ? 'bg-gradient-to-r from-slate-500/90 to-slate-600/90 hover:from-slate-600/95 hover:to-slate-700/95 focus:ring-slate-500/70 shadow-slate-500/25' 
                              : 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 dark:from-slate-400 dark:to-slate-500 dark:hover:from-slate-500 dark:hover:to-slate-600 focus:ring-slate-500 dark:focus:ring-slate-300 shadow-slate-500/25')
                        }`}
                      aria-label={isContinuousMode ? 'Stop continuous mode' : 'Start continuous mode'}
                    >
                      {isContinuousMode ? (
                        <>
                          <MicOff size={18} className="recording-indicator" />
                          Stop Continuous
                        </>
                      ) : (
                        <>
                          <Mic size={18} className="transition-transform duration-300 hover:scale-110" />
                          Continuous Mode
                        </>
                      )}
                    </button>

                    {/* Clear Button - Tertiary */}
                    {(transcription || continuousModeTranscription) && (
                      <button
                        type="button"
                        onClick={clearAudioData}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) hover-lift shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-opacity-50
                          ${theme === 'surprise' 
                            ? 'bg-gradient-to-r from-gray-400/80 to-gray-500/80 hover:from-gray-500/90 hover:to-gray-600/90 text-white focus:ring-gray-500/70 shadow-gray-500/25' 
                            : 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 dark:from-gray-500 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white focus:ring-gray-500 dark:focus:ring-gray-300 shadow-gray-500/25'}`}
                        aria-label="Clear audio data"
                      >
                        <Trash2 size={18} className="transition-transform duration-300 hover:scale-110" />
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Recording Timer */}
                  {isRecording && (
                    <div className={`mb-3 p-3 rounded-lg text-center ${theme === 'surprise' ? 'bg-red-100/50 text-red-800' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                      <div className="text-lg font-mono font-bold recording-timer">{formatTime(recordingTime)}</div>
                      <div className="text-sm">Recording in progress...</div>
                      {/* Audio Visualizer */}
                      <div className="audio-visualizer mt-2">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div
                            key={i}
                            className="audio-bar"
                            style={{
                              animationDelay: `${i * 0.1}s`,
                              animationDuration: `${0.5 + Math.random() * 0.5}s`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Speech Recognition Status */}
                  {isListening && (
                    <div className={`mb-3 p-4 rounded-xl text-center border ${theme === 'surprise' ? 'bg-blue-50/80 text-blue-800 border-blue-200/50' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800'}`}>
                      <div className="text-sm font-semibold">Auto Voice Active</div>
                      <div className="text-xs">Text will be automatically inserted after 0.5 seconds</div>
                      {/* Voice Wave Animation */}
                      <div className="flex justify-center items-center gap-1 mt-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 bg-current rounded-full voice-listening`}
                            style={{
                              height: `${20 + i * 8}px`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                      {/* Auto-insertion indicator */}
                      <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                        <span className="inline-flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          Auto-inserting text
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Auto-restart indicator */}
                  {isAutoRestarting && (
                    <div className={`mb-3 p-3 rounded-lg text-center ${theme === 'surprise' ? 'bg-yellow-100/50 text-yellow-800' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'}`}>
                      <div className="text-sm font-semibold">Auto-restarting...</div>
                      <div className="text-xs">Speech recognition will resume in a moment</div>
                      <div className="flex justify-center items-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  )}

                  {/* Audio Player */}
                  {audioUrl && (
                    <div className={`mb-3 p-3 rounded-lg ${theme === 'surprise' ? 'bg-gray-100/50' : 'bg-gray-50 dark:bg-slate-700/50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Volume2 size={16} className={theme === 'surprise' ? 'text-gray-600' : 'text-gray-500 dark:text-slate-400'} />
                        <span className={`text-sm font-semibold ${theme === 'surprise' ? 'text-gray-700' : 'text-gray-600 dark:text-slate-300'}`}>
                          Recorded Audio
                        </span>
                      </div>
                      <audio controls className="w-full">
                        <source src={audioUrl} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {/* Transcription Display */}
                  {transcription && (
                    <div className={`mb-3 p-4 rounded-xl border ${theme === 'surprise' ? 'bg-emerald-50/80 border-emerald-200/50' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-semibold ${theme === 'surprise' ? 'text-emerald-800' : 'text-emerald-700 dark:text-emerald-300'}`}>
                          Live Preview
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                          Will auto-insert in 0.5s
                        </span>
                      </div>
                      <div className={`text-sm transcription-text ${theme === 'surprise' ? 'text-emerald-700' : 'text-emerald-600 dark:text-emerald-200'}`}>
                        {transcription}
                      </div>
                    </div>
                  )}

                  {/* Continuous Mode Status */}
                  {isContinuousMode && (
                    <div className={`mb-3 p-4 rounded-xl text-center border ${theme === 'surprise' ? 'bg-indigo-50/80 text-indigo-800 border-indigo-200/50' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'}`}>
                      <div className="text-sm font-semibold">Continuous Mode Active</div>
                      <div className="text-xs">Listening forever - only stops when you click stop</div>
                      {/* Voice Wave Animation */}
                      <div className="flex justify-center items-center gap-1 mt-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 bg-current rounded-full voice-listening`}
                            style={{
                              height: `${20 + i * 8}px`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                      {/* Continuous mode indicator */}
                      <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                        <span className="inline-flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          Never stops - immediate insertion
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Continuous Mode Live Preview */}
                  {continuousModeTranscription && (
                    <div className={`mb-3 p-4 rounded-xl border ${theme === 'surprise' ? 'bg-indigo-50/80 border-indigo-200/50' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-semibold ${theme === 'surprise' ? 'text-indigo-800' : 'text-indigo-700 dark:text-indigo-300'}`}>
                          Continuous Preview
                        </span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400">
                          Immediate insertion
                        </span>
                      </div>
                      <div className={`text-sm transcription-text ${theme === 'surprise' ? 'text-indigo-700' : 'text-indigo-600 dark:text-indigo-200'}`}>
                        {continuousModeTranscription}
                      </div>
                    </div>
                  )}
                </div>

                <div className={`mt-4 pt-4 transition-all duration-300 ${theme === 'surprise' ? 'border-t border-black/10' : 'border-t border-gray-200 dark:border-slate-700'}`}>
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className={`flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) hover-lift shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-opacity-50
                        ${theme === 'surprise' 
                          ? 'bg-gradient-to-r from-slate-500/90 to-slate-600/90 hover:from-slate-600/95 hover:to-slate-700/95 focus:ring-slate-500/70 shadow-slate-500/25' 
                          : 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 dark:from-slate-400 dark:to-slate-500 dark:hover:from-slate-500 dark:hover:to-slate-600 focus:ring-slate-500 dark:focus:ring-slate-300 shadow-slate-500/25'}`}
                      aria-label="Upload images"
                    >
                      <ImageIcon size={18} className="transition-transform duration-300 hover:scale-110" />
                      Add Images
                    </button>
                    <button
                      type="button"
                      onClick={handleSummarize}
                      disabled={isLoadingGemini || !currentContent.trim()}
                      className={`flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) disabled:opacity-50 hover-lift shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-opacity-50
                        ${isLoadingGemini || !currentContent.trim()
                          ? (theme === 'surprise' 
                              ? 'bg-gradient-to-r from-gray-400/70 to-gray-500/70 shadow-gray-500/25' 
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600 shadow-gray-500/25')
                          : (theme === 'surprise' 
                              ? 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-600/95 hover:to-blue-700/95 focus:ring-blue-500/70 shadow-blue-500/25' 
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-400 dark:to-blue-500 dark:hover:from-blue-500 dark:hover:to-blue-600 focus:ring-blue-500 dark:focus:ring-blue-300 shadow-blue-500/25')
                        }`}
                      aria-label="Summarize note with Gemini"
                    >
                      {isLoadingGemini && geminiActionType === 'summarize' ? <Loader2 size={18} className="spin-slow" /> : <Sparkles size={18} className="transition-transform duration-300 hover:rotate-12" />}
                      Summarize
                    </button>
                    <button
                      type="button"
                      onClick={handleBrainstorm}
                      disabled={isLoadingGemini || !currentContent.trim()}
                      className={`flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) disabled:opacity-50 hover-lift shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-opacity-50
                        ${isLoadingGemini || !currentContent.trim()
                          ? (theme === 'surprise' 
                              ? 'bg-gradient-to-r from-gray-400/70 to-gray-500/70 shadow-gray-500/25' 
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600 shadow-gray-500/25')
                          : (theme === 'surprise' 
                              ? 'bg-gradient-to-r from-indigo-500/90 to-indigo-600/90 hover:from-indigo-600/95 hover:to-indigo-700/95 focus:ring-indigo-500/70 shadow-indigo-500/25' 
                              : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 dark:from-indigo-400 dark:to-indigo-500 dark:hover:from-indigo-500 dark:hover:to-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-300 shadow-indigo-500/25')
                        }`}
                      aria-label="Brainstorm ideas with Gemini"
                    >
                      {isLoadingGemini && geminiActionType === 'brainstorm' ? <Loader2 size={18} className="spin-slow" /> : <Lightbulb size={18} className="transition-transform duration-300 hover:scale-110" />}
                      Brainstorm
                    </button>
                     <button
                      type="button"
                      onClick={handleBeautify}
                      disabled={isLoadingGemini || !currentContent.trim()}
                      className={`flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) disabled:opacity-50 hover-lift shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-opacity-50
                        ${isLoadingGemini || !currentContent.trim()
                          ? (theme === 'surprise' 
                              ? 'bg-gradient-to-r from-gray-400/70 to-gray-500/70 shadow-gray-500/25' 
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600 shadow-gray-500/25')
                          : (theme === 'surprise' 
                              ? 'bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 hover:from-emerald-600/95 hover:to-emerald-700/95 focus:ring-emerald-500/70 shadow-emerald-500/25' 
                              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 dark:from-emerald-400 dark:to-emerald-500 dark:hover:from-emerald-500 dark:hover:to-emerald-600 focus:ring-emerald-500 dark:focus:ring-emerald-300 shadow-emerald-500/25')
                        }`}
                      aria-label="Beautify note with Gemini"
                    >
                      {isLoadingGemini && geminiActionType === 'beautify' ? <Loader2 size={18} className="spin-slow" /> : <Brush size={18} className="transition-transform duration-300 hover:rotate-12" />}
                      Beautify
                    </button>
                     <button
                        type="button"
                        onClick={() => handleDeleteNote(selectedNoteId)}
                        className={`ml-auto flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) disabled:opacity-50 hover-lift shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-opacity-50
                          ${theme === 'surprise' 
                            ? 'bg-gradient-to-r from-gray-400/80 to-gray-500/80 hover:from-gray-500/90 hover:to-gray-600/90 text-white focus:ring-gray-500/70 shadow-gray-500/25' 
                            : 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 dark:from-gray-500 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white focus:ring-gray-500 dark:focus:ring-gray-300 shadow-gray-500/25'}`}
                        disabled={!selectedNoteId}
                        aria-label="Delete current note"
                      >
                        <Trash2 size={18} className="transition-transform duration-300 hover:scale-110" />
                        Delete Note
                      </button>
                  </div>
                  {isLoadingGemini && !geminiResult && (
                    <div className={`p-4 rounded-lg text-sm flex items-center transition-all duration-300 shimmer
                      ${theme === 'light' ? 'bg-gray-50/90 text-gray-600' :
                        theme === 'dark' ? 'bg-slate-700/90 text-slate-300' :
                        'bg-white/50 text-gray-700 backdrop-blur-xs'
                      }`}
                    >
                      <Loader2 size={18} className="spin-slow mr-2" />
                      {currentGeminiTitle || "Gemini is working..."}
                    </div>
                  )}
                  {(geminiResult || (isLoadingGemini && geminiActionType)) && (
                    <div className={geminiResultBoxClasses}>
                      {currentGeminiTitle && (
                        <h4 className={geminiResultTitleClasses}>
                          {(geminiActionType === 'summarize' || currentGeminiTitle.includes("Summary")) && <Sparkles size={18} className="text-indigo-500 dark:text-indigo-300 transition-transform duration-300 hover:rotate-12" />}
                          {(geminiActionType === 'brainstorm' || currentGeminiTitle.includes("Ideas")) && <Lightbulb size={18} className="text-purple-500 dark:text-purple-300 transition-transform duration-300 hover:scale-110" />}
                          {(geminiActionType === 'beautify' || currentGeminiTitle.includes("Beautified")) && <Brush size={18} className="text-teal-500 dark:text-teal-300 transition-transform duration-300 hover:rotate-12" />}
                          {currentGeminiTitle}
                        </h4>
                      )}
                      {geminiResult ? (
                        <TypingEffect
                          textToType={geminiResult}
                          theme={theme}
                          typingSpeed={15}
                        />
                      ) : (
                         isLoadingGemini && <div className="text-sm text-gray-500 dark:text-slate-400">Loading response...</div>
                      )}
                      {geminiActionType === 'beautify' && geminiResult && !isLoadingGemini && (
                        <button
                          type="button"
                          onClick={handleReplaceWithBeautifiedContent}
                          className={replaceButtonClasses}
                          aria-label="Replace original note content with this beautified version and save"
                        >
                          <CopyCheck size={16} className="transition-transform duration-300 hover:scale-110" />
                          Replace Original & Save
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="fade-in float-animation">
                  <MessageSquareText size={48} className={`mb-4 transition-all duration-300 ${theme === 'surprise' ? 'text-gray-500/70' : 'text-gray-300 dark:text-slate-600'}`} />
                  <h2 className={`text-xl font-semibold transition-all duration-300 ${theme === 'surprise' ? 'text-gray-800' : 'text-gray-700 dark:text-slate-300'}`}>
                    Select a note
                  </h2>
                  <p className={`transition-all duration-300 ${theme === 'surprise' ? 'text-gray-600' : 'text-gray-500 dark:text-slate-400'}`}>
                    Choose a note from the list to view or edit, or create a new one.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
