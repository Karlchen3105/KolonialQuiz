import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { GameState, Player, Question } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  // Game State
  const questions: Question[] = [
    {
      question: "Wie groß ist der Teil der Erde, der in den letzten 500 Jahren unter kolonialer Herrschaft einer europäischen Macht stand?",
      options: [
        "Über 20 % der Landflächen der Erde",
        "Über 40 % der Landflächen der Erde",
        "Über 80 % der Landflächen der Erde"
      ],
      correctIndex: 2,
      timeLimit: 20,
      imageTitle: "Länder unter europäischer Kontrolle",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Colonization_1945.png/800px-Colonization_1945.png" // Using a placeholder map for now
    },
    {
      question: "Welches Land war die größte Kolonialmacht der letzten Jahrhunderte?",
      options: [
        "Frankreich",
        "Großbritannien",
        "Spanien"
      ],
      correctIndex: 1,
      timeLimit: 20,
      imageTitle: "Ausdehnung des Britischen Empire 1919",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/British_Empire_1919.png/800px-British_Empire_1919.png"
    },
    {
      question: "War Deutschland auch eine Kolonialmacht?",
      options: [
        "Nein, das deutsche Kaiserreich hat in den letzten 300 Jahren keine Versuche unternommen, Kolonialmacht zu werden.",
        "Das deutsche Kaiserreich hat im 19. Jahrhundert zwar versucht, sich Kolonien anzueignen, war aber nicht erfolgreich.",
        "Ja, das deutsche Kaiserreich wurde Ende des 19. Jahrhunderts Kolonialmacht – mit dem Ziel, koloniale Großmächte wie Großbritannien und Frankreich zu kopieren."
      ],
      correctIndex: 2,
      timeLimit: 30,
      imageTitle: "Berliner Afrika-Konferenz: 1884/85: Aufteilung Afrikas in europäische Kolonien",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Kongokonferenz.jpg/800px-Kongokonferenz.jpg"
    },
    {
      question: "Welche heutigen Staaten waren einmal unter deutscher Kolonialherrschaft?",
      options: [
        "Vor allem afrikanische Staaten u. a. Tansania und Namibia.",
        "Vor allem lateinamerikanische Länder u. a. Ecuador und Peru.",
        "Vor allem asiatische Staaten u. a. Vietnam und Laos."
      ],
      correctIndex: 0,
      timeLimit: 25,
      imageTitle: "Deutsche Kolonialgeschichte",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Deutsche_Kolonien.PNG/800px-Deutsche_Kolonien.PNG"
    },
    {
      question: "Wann endete die Kolonialherrschaft Europas über die letzten Kolonien?",
      options: [
        "1925",
        "1950",
        "1975"
      ],
      correctIndex: 2,
      timeLimit: 20,
      imageTitle: "Colonial powers, 1976",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Colonization_1945.png/800px-Colonization_1945.png" // Placeholder
    },
    {
      question: "Warum kolonisierten europäische Mächte riesige Gebiete in der ganzen Welt?",
      options: [
        "Als Reaktion auf Angriffe der später kolonisierten Gesellschaften.",
        "Um möglichst viel politische Macht und wirtschaftlichen Profit zu erlangen.",
        "Um europäische Ideale an die kolonisierten Gesellschaften weiterzugeben."
      ],
      correctIndex: 1,
      timeLimit: 25,
      imageTitle: "Brief von Richard Barwell an seinen Vater (1765)",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Richard_Barwell_Reynolds.Jpeg/800px-Richard_Barwell_Reynolds.Jpeg"
    }
  ];

  let gameState: GameState = {
    status: 'lobby', // lobby, question, results, image, podium
    currentQuestionIndex: 0,
    players: {},
    timeRemaining: 0,
    questionStartTime: 0,
    question: questions[0]
  };

  let timerInterval: NodeJS.Timeout | null = null;

  function broadcastState() {
    gameState.question = questions[gameState.currentQuestionIndex];
    io.emit("gameState", gameState);
  }

  function startTimer(duration: number, onComplete: () => void) {
    if (timerInterval) clearInterval(timerInterval);
    gameState.timeRemaining = duration;
    gameState.questionStartTime = Date.now();

    timerInterval = setInterval(() => {
      gameState.timeRemaining--;
      if (gameState.timeRemaining <= 0) {
        clearInterval(timerInterval!);
        onComplete();
      }
      // We don't broadcast every second to save bandwidth, clients can interpolate
      // But for simplicity, we can broadcast time updates or let clients handle it
      io.emit("timeUpdate", gameState.timeRemaining);
    }, 1000);
  }

  io.on("connection", (socket) => {
    socket.emit("gameState", gameState);

    socket.on("join", (name) => {
      gameState.players[socket.id] = { name, score: 0, currentAnswer: null };
      broadcastState();
    });

    socket.on("answer", (optionIndex) => {
      if (gameState.status === 'question' && gameState.players[socket.id]) {
        // Only allow answering once per question
        if (gameState.players[socket.id].currentAnswer === null) {
          gameState.players[socket.id].currentAnswer = optionIndex;

          // Calculate score based on time
          const q = questions[gameState.currentQuestionIndex];
          if (optionIndex === q.correctIndex) {
            const timeTaken = (Date.now() - gameState.questionStartTime) / 1000;
            const timeRatio = Math.max(0, (q.timeLimit - timeTaken) / q.timeLimit);
            const points = Math.round(500 + (500 * timeRatio)); // Max 1000 pts
            gameState.players[socket.id].score += points;
          }

          broadcastState();
        }
      }
    });

    socket.on("hostAction", (action) => {
      if (action === "start") {
        gameState.status = 'question';
        gameState.currentQuestionIndex = 0;
        Object.values(gameState.players).forEach(p => p.currentAnswer = null);

        startTimer(questions[0].timeLimit, () => {
          gameState.status = 'results';
          broadcastState();
        });
        broadcastState();
      }
      else if (action === "showResults") {
        if (timerInterval) clearInterval(timerInterval);
        gameState.status = 'results';
        broadcastState();
      }
      else if (action === "showImage") {
        gameState.status = 'image';
        broadcastState();
      }
      else if (action === "nextQuestion") {
        gameState.currentQuestionIndex++;
        if (gameState.currentQuestionIndex >= questions.length) {
          gameState.status = 'podium';
        } else {
          gameState.status = 'question';
          Object.values(gameState.players).forEach(p => p.currentAnswer = null);
          startTimer(questions[gameState.currentQuestionIndex].timeLimit, () => {
            gameState.status = 'results';
            broadcastState();
          });
        }
        broadcastState();
      }
      else if (action === "reset") {
        gameState.status = 'lobby';
        gameState.currentQuestionIndex = 0;
        gameState.players = {};
        if (timerInterval) clearInterval(timerInterval);
        broadcastState();
      }
    });

    socket.on("disconnect", () => {
      if (gameState.players[socket.id]) {
        delete gameState.players[socket.id];
        broadcastState();
      }
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
