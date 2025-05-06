import { Suspense } from "react"
import YouTubeInput from "@/components/youtube-input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, MessageSquare, Youtube } from "lucide-react"
import ExampleVideos from "@/components/example-videos"

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-50 to-white border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-500 p-3 rounded-2xl shadow-lg">
                <Youtube className="h-8 w-8 text-white" />
              </div>
              <div className="ml-3 bg-slate-800 p-3 rounded-2xl shadow-lg">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              SieveTube Chat
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Chat with any YouTube video. Ask questions, get summaries, and interact with video content through AI.
            </p>

            <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
              <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                <YouTubeInput />
              </Suspense>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="#examples">
                <Button variant="outline" size="lg" className="gap-2">
                  Try with examples <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="ghost" size="lg">
                  How it works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Examples Section */}
      <section id="examples" className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Try with these examples</h2>
          <ExampleVideos />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 text-center">
              <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Paste YouTube URL</h3>
              <p className="text-slate-600">Enter any YouTube video URL in the search box above</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 text-center">
              <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Process Video</h3>
              <p className="text-slate-600">Our AI extracts and analyzes the video transcript</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 text-center">
              <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Chatting</h3>
              <p className="text-slate-600">Ask questions and interact with the video content</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400">© {new Date().getFullYear()} SieveTube Chat. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
