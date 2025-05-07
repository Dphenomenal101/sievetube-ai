# SieveTube AI 🎥

SieveTube is a free AI tool that lets you have chat with any YouTube video. Ask questions and get accurate answers backed by precise video timestamps, making it easy to verify information directly from the source. Powered by Google's Gemini 2.0 Flash, it understands video context deeply and provides reliable, evidence-based responses.

## 🌟 Features

- **Interactive Video Chat**: Have natural conversations about any YouTube video
- **Timestamp-Backed Answers**: Every response is supported by precise video timestamps for easy verification
- **Deep Understanding**: Uses Gemini 2.0 Flash to comprehend video content thoroughly
- **Source Verification**: Jump directly to relevant video segments to verify information
- **Modern UI**: Clean, intuitive interface built with Next.js and Tailwind CSS
- **Real-time Processing**: Quick responses to your questions about the video

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PNPM package manager
- YouTube API key
- Gemini API key
- Sieve API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Dphenomenal101/sievetube-ai.git
cd sievetube-ai
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your API keys and configuration

4. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## 🔑 Environment Variables

Create a `.env` file with the following variables:

```env
SIEVE_API_KEY=your_sieve_api_key
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key
API_URL=http://localhost:3000
```

### Obtaining API Keys

#### YouTube API Key
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3 from the Library
4. Go to Credentials and create an API key
5. Copy the API key to your `.env` file

#### Gemini API Key
1. Visit the [Google AI Studio](https://aistudio.google.com/apikey/)
2. Sign in with your Google account
3. Click on "Create API Key"
4. Copy the generated API key to your `.env` file

#### Sieve API Key
1. Visit [Sieve](https://www.sievedata.com/)
2. Create an account or sign in
3. Navigate to the API section in your dashboard
4. Generate a new API key
5. Copy the API key to your `.env` file

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini 2.0 Flash
- **Video Processing**: Sieve
- **Language**: TypeScript

## 📝 Usage

1. Enter a YouTube URL in the input field
2. Click "Start Chat" to begin the conversation
3. Ask questions about the video content
4. Get AI responses with clickable timestamps
5. Click timestamps to verify information directly in the video

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Created by D'phenomenal

## 🙏 Acknowledgments

- Google Gemini for providing the AI capabilities
- Sieve for video processing infrastructure
- YouTube API for video data access 