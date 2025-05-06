"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Bot, UserIcon, Info } from "lucide-react";
import type { VideoInfo } from "@/lib/youtube-api";
import { cn, convertMessageContentToHTML } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { TypingAnimation } from "./typing-animation";

interface ChatInterfaceProps {
  videoId: string;
  videoInfo: VideoInfo;
}

type MessageType = "system" | "user" | "assistant";

interface Message {
  id: string;
  content: string;
  role: MessageType;
  timestamp?: Date;
}

interface JobState {
  downloadJobId: string | null;
  transcriptionJobId: string | null;
  status: "downloading" | "transcribing" | "finished" | "failed";
  lastChecked: number;
}

export default function ChatInterface({
  videoId,
  videoInfo,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-1",
      content: "Processing video transcript...",
      role: "system",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isChatAvailable, setIsChatAvailable] = useState(false);
  const [jobState, setJobState] = useLocalStorage<JobState>(
    `video-job-${videoId}`,
    {
      downloadJobId: null,
      transcriptionJobId: null,
      status: "downloading",
      lastChecked: 0,
    }
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("Initial jobState:", jobState);
    console.log("Initial UI state:", {
      isProcessing,
      processingProgress,
      isChatAvailable,
    });
  }, []);

  useEffect(() => {
    if (jobState.status === "finished") {
      setIsProcessing(false);
      setProcessingProgress(100);
      setIsChatAvailable(true);
      setMessages(prev => {
        const hasCompletionMessage = prev.some(m => m.id === "system-2");
        if (!hasCompletionMessage) {
          return [
            ...prev.filter(m => m.id !== "system-1"),
            {
              id: "system-2",
              content: `Transcript ready for "${videoInfo.title}". You can now chat about the video content.`,
              role: "system",
              timestamp: new Date(),
            },
          ];
        }
        return prev;
      });
      return;
    }

    if (jobState.status === "failed") {
      setIsProcessing(false);
      setProcessingProgress(0);
      setIsChatAvailable(false);
      setMessages(prev => [
        ...prev.filter(m => m.id !== "system-1"),
        {
          id: "system-error",
          content: "Failed to process the video. Please try refreshing the page or try a different video.",
          role: "system",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const checkStatus = async () => {
      if (!jobState.transcriptionJobId) return;

      try {
        const response = await fetch("/api/job-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: jobState.transcriptionJobId }),
        });

        if (!response.ok) {
          throw new Error("Failed to check job status");
        }

        const status = await response.json();
        console.log("Job status response:", status);

        if (status.status === "finished") {
          setIsProcessing(false);
          setProcessingProgress(100);
          setIsChatAvailable(true);
          setJobState(prev => ({
            ...prev,
            status: "finished",
            lastChecked: Date.now(),
          }));
          setMessages(prev => [
            ...prev.filter(m => m.id !== "system-1"),
            {
              id: "system-2",
              content: `Transcript ready for "${videoInfo.title}". You can now chat about the video content.`,
              role: "system",
              timestamp: new Date(),
            },
          ]);
        } else if (status.status === "failed") {
          setJobState(prev => ({ ...prev, status: "failed" }));
          setIsProcessing(false);
          setProcessingProgress(0);
          setIsChatAvailable(false);
          setMessages(prev => [
            ...prev.filter(m => m.id !== "system-1"),
            {
              id: "system-error",
              content: "Failed to process the video. Please try refreshing the page or try a different video.",
              role: "system",
              timestamp: new Date(),
            },
          ]);
        } else if (status.progress) {
          setProcessingProgress(status.progress * 100);
        }
      } catch (error) {
        console.error("Error checking job status:", error);
        setJobState(prev => ({ ...prev, status: "failed" }));
        setIsProcessing(false);
        setProcessingProgress(0);
        setIsChatAvailable(false);
        setMessages(prev => [
          ...prev.filter(m => m.id !== "system-1"),
          {
            id: "system-error",
            content: "Failed to check video processing status. Please try refreshing the page.",
            role: "system",
            timestamp: new Date(),
          },
        ]);
      }
    };

    const pollInterval = setInterval(checkStatus, 5000);
    return () => clearInterval(pollInterval);
  }, [jobState.status, jobState.transcriptionJobId, videoInfo.title]);

  useEffect(() => {
    const processVideo = async () => {
      // Only process if we don't have a job state or if the previous attempt failed
      if (jobState.status === "finished") {
        setIsProcessing(false);
        setProcessingProgress(100);
        setIsChatAvailable(true);
        setMessages([{
          id: "system-2",
          content: `Transcript ready for "${videoInfo.title}". You can now chat about the video content.`,
          role: "system",
          timestamp: new Date(),
        }]);
        return;
      }

      // Reset state when starting a new process
      setMessages([{
        id: "system-1",
        content: "Processing video transcript...",
        role: "system",
        timestamp: new Date(),
      }]);
      setIsProcessing(true);
      setProcessingProgress(0);
      setIsChatAvailable(false);

      try {
        const response = await fetch("/api/process-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });

        if (!response.ok) {
          throw new Error("Failed to process video");
        }

        const data = await response.json();
        setJobState({
          downloadJobId: data.downloadJobId,
          transcriptionJobId: data.transcriptionJobId,
          status: data.status,
          lastChecked: Date.now(),
        });
      } catch (error) {
        console.error("Error processing video:", error);
        setJobState(prev => ({ ...prev, status: "failed" }));
      }
    };

    processVideo();
  }, [videoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isChatAvailable) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role === "system" ? "assistant" : m.role,
            content: m.content,
          })),
          transcriptionJobId: jobState.transcriptionJobId,
          videoMetadata: videoInfo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: data.response,
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages(prev => [
        ...prev,
        {
          id: "error",
          content: "Sorry, something went wrong. Please try again.",
          role: "system",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date?: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  return (
    <Card className="h-[600px] flex flex-col shadow-sm border border-slate-100">
      <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageBubbleIcon className="h-5 w-5 text-slate-600" />
            Chat
          </CardTitle>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">
                Ask questions about the video content, request summaries, or
                discuss specific parts of the video.
                {jobState.status === "failed" &&
                  " Processing failed - please try refreshing the page."}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const timestamp = message.timestamp || new Date();

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 max-w-[90%] animate-fadeIn",
                message.role === "user"
                  ? "ml-auto flex-row-reverse"
                  : "mr-auto",
                message.role === "system"
                  ? "mx-auto flex-col items-center text-center"
                  : "",
                message.role === "system" && message.id === "system-error"
                  ? "text-red-600"
                  : ""
              )}
            >
              {message.role !== "system" && (
                <div
                  className={cn(
                    "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                    message.role === "user"
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-800"
                  )}
                >
                  {message.role === "user" ? (
                    <UserIcon className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
              )}

              <div
                className={cn(
                  "rounded-xl p-3 relative",
                  message.role === "user"
                    ? "bg-slate-800 text-white"
                    : message.role === "assistant"
                    ? "bg-slate-100 text-slate-800"
                    : "bg-blue-50 text-blue-800 text-sm border border-blue-100 rounded-full px-4 py-2"
                )}
              >
                {message.role === "assistant" ? (
                  <div dangerouslySetInnerHTML={{ 
                    __html: convertMessageContentToHTML(message.content, videoId) 
                  }} />
                ) : (
                  message.content
                )}

                {message.role !== "system" && (
                  <div
                    className={cn(
                      "text-xs mt-1 opacity-70",
                      message.role === "user"
                        ? "text-slate-300"
                        : "text-slate-500"
                    )}
                  >
                    {formatTime(timestamp)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-[90%] animate-fadeIn mr-auto">
            <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-800">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-xl p-3 bg-slate-100">
              <TypingAnimation />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-50 rounded-full p-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-slate-800">Processing Video</h4>
                <p className="text-sm text-slate-600">
                  This typically takes 3-5 minutes
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={cn(
                    "flex-shrink-0 h-2 w-2 rounded-full",
                    jobState.status === "downloading"
                      ? "bg-blue-500"
                      : "bg-slate-200"
                  )}
                />
                <span
                  className={cn(
                    "text-sm",
                    jobState.status === "downloading"
                      ? "text-slate-800"
                      : "text-slate-500"
                  )}
                >
                  Downloading video
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={cn(
                    "flex-shrink-0 h-2 w-2 rounded-full",
                    jobState.status === "transcribing"
                      ? "bg-blue-500"
                      : "bg-slate-200"
                  )}
                />
                <span
                  className={cn(
                    "text-sm",
                    jobState.status === "transcribing"
                      ? "text-slate-800"
                      : "text-slate-500"
                  )}
                >
                  Generating transcript
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <CardFooter className="p-3 border-t">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            disabled={isLoading || !isChatAvailable}
            placeholder={
              isChatAvailable
                ? "Ask a question about the video..."
                : "Waiting for transcript..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                isChatAvailable &&
                !isLoading
              ) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !isChatAvailable}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

function MessageBubbleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
