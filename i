<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dark Web Style</title>
    <style>
        body {
            font-family: "Courier New", monospace;
            background-color: #0d0d0d;
            color: #00ff41; /* Vert fluorescent style "Matrix" */
            margin: 0;
            padding: 20px;
            overflow-x: hidden;
        }

        .menu-icon {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 30px;
            cursor: pointer;
            z-index: 10;
        }

        .menu-icon div {
            width: 100%;
            height: 5px;
            background-color: #ff0000; /* Rouge agressif */
            margin: 6px 0;
        }

        .sliding-panel {
            position: fixed;
            top: 0;
            left: -250px;
            width: 250px;
            height: 100%;
            background-color: #1a1a1a; /* Noir cassé */
            color: #ff0000; /* Rouge menaçant */
            transition: 0.3s ease;
            box-shadow: 2px 0 10px rgba(255, 0, 0, 0.8);
            z-index: 9;
            padding: 20px;
        }

        .sliding-panel a {
            display: block;
            padding: 10px;
            color: #ff0000;
            text-decoration: none;
            font-size: 18px;
            margin: 10px 0;
        }

        .sliding-panel a:hover {
            background-color: #2a0000; /* Rouge très sombre */
        }

        .container {
            max-width: 500px;
            margin: 20px auto;
            background-color: #1a1a1a; /* Fond sombre */
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); /* Éclat rouge inquiétant */
        }

        .header {
            background-color: #2a0000; /* Rouge très sombre */
            padding: 15px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #ff0000; /* Rouge vif */
        }

        .content {
            padding: 15px;
        }

        .content h3 {
            margin-top: 0;
            color: #00ff41; /* Vert fluorescent */
        }

        .box {
            background-color: #1a1a1a; /* Noir cassé */
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 5px;
            border: 1px solid #ff0000; /* Rouge vif */
        }

        .box a {
            display: block;
            color: #ff0000; /* Rouge vif */
            font-weight: bold;
            text-decoration: none;
            margin-bottom: 10px;
        }

        .box a:hover {
            color: #00ff41; /* Vert fluorescent */
        }

        .statistics {
            background-color: #2a0000;
            padding: 10px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            border-top: 1px solid #ff0000;
            color: #ff0000; /* Texte en rouge */
        }

        .overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9); /* Fond noir opaque */
            z-index: 8;
            transition: opacity 0.3s ease;
        }

        .overlay.active {
            display: block;
        }

        .sliding-panel.inactive {
            left: -250px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .sliding-panel.active {
            left: 0;
            opacity: 1;
        }

        .ai-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .ai-table, .ai-table th, .ai-table td {
            border: 1px solid #ff0000;
        }

        .ai-table th, .ai-table td {
            padding: 15px;
            text-align: left;
            color: #ff0000;
        }

        .ai-table th {
            background-color: #2a0000;
        }

        .ai-table tr:nth-child(even) {
            background-color: #1a1a1a;
        }

        .ai-table tr:hover {
            background-color: #2a0000;
        }

        .ai-question {
            cursor: pointer;
            color: #00ff41;
        }

        .answer {
            display: none;
            color: #ff0000;
        }
    </style>
</head>
<body>
    <div id="overlay" class="overlay" onclick="togglePanel()"></div>

    <div class="menu-icon" onclick="togglePanel()">
        <div></div>
        <div></div>
        <div></div>
    </div>

    <div id="slidingPanel" class="sliding-panel inactive">
        <a href="rayen.html">About me</a>
        <a href="admin1.html">Admin profile</a>
        <a href="foruser.html">Disclaimer</a>
        <a href="send.html">Contact Us</a>
        <a href="statistique.html">Problems review</a>
        <a href="game2.html">Destructive game</a>
        <a href="play1.html">Intellectual game</a>
        <a href="log.in.html">Log in to receive news</a>
        <a href="news.html">News of Quantum Nexus Labs</a>
    </div>
<div class="container">
        <div class="header">Rayen IA</div>
        <div class="content">
            <h3>This page is online on 23/2/2025</h3>
            <div class="box">
                <a href="gbt.html">Rayen IA</a>
                <!-- Ajoutez d'autres liens ici -->
            </div>
        </div>
    </div>
    
    <div class="container">
        <div class="header">About</div>
        <div class="content">
            <h3>This page is online on 22/7/2024</h3>
            <div class="box">
                <a href="aboutversion.html">About Our new version </a>
                <!-- Ajoutez d'autres liens ici -->
            </div>
        </div>
    </div>
  
    <div class="container">
        <div class="header">Privacy rule</div>
        <div class="content">
            <h3>This page is online on 22/7/2024</h3>
            <div class="box">
                <a href="confidelity.html">Privacy rule</a>
                <!-- Ajoutez d'autres liens ici -->
            </div>
        </div>
    </div>
  
    <div class="container">
        <div class="header">Install our application</div>
        <div class="content">
            <h3>This page is online on 22/7/2024</h3>
            <div class="box">
                <a href="install application.html">Install our application</a>
                <!-- Ajoutez d'autres liens ici -->
            </div>
        </div>
    </div>
    <div class="container">
        <div class="header">Courses and problems </div>
        <div class="content">
            <h3>This page is online on 1/8/2024</h3>
            <div class="box">
                <a href="courses and problems.html">courses and problems</a>
                <!-- Ajoutez d'autres liens ici -->
            </div>
        </div>
    </div>
  
    <div class="container">
        <div class="header">New problems make a challenge with yourself!</div>
        <div class="content">
            <h3>This page is online on 22/7/2024</h3>
            <div class="box">
                <a href="probleme.html">Challenge problems with score try to get full marks!</a>
                <!-- Ajoutez d'autres liens ici -->
            </div>
        </div>
    </div>
  
    <div class="container">
        <div class="header">Number Theory</div>
        <div class="content">
            <h3>This page is online on 22/7/2024</h3>
            <div class="box">
                <a href="number theory.html">Number Theory</a>
                <!-- Ajoutez d'autres liens ici -->
            </div>
        </div>
        <div class="statistics">
            <p></p>
            <p></p>
        </div>
    </div>
  
    <div class="container">
        <div class="header">Combinatorics</div>
        <div class="content">
            <h3>This page is online on 22/7/2024</h3>
            <div class="box">
                <a href="combinatoire.html">Combinatorics</a>
                <!-- Ajoutez d'autres liens ici -->
            </div>
        </div>
        <div class="statistics">
            <p></p>
            <p></p>
        </div>
    </div>
  
    <div class="container">
        <div class="header">Geometry</div>
        <div class="content">
            <h3>This page is online on 22/7/2024</h3>
            <div class="box">
                <a href="geometry.html">Geometry</a>
                <!-- Ajoutez d'autres liens ici -->
            </div>
        </div>
        <div class="statistics">
            <p></p>
            <p></p>
        </div>
    </div>
  
    <div class="container">
        <div class="header">Functional Equations</div>
        <div class="content">
            <h3>This page is online on 22/7/2024</h3>
            <div class="box">
                <a href="functionnal equation.html">Functionnal equation</a>
                <!-- Ajoutez d'autres liens ici -->
            </div>
        </div>
        <div class="statistics">
            <p></p>
            <p></p>
        </div>
    </div>
  <div class="container">
        <div class="header">Forum</div>
        <div class="content">
            <h3>This page is online on 22/7/2024</h3>
            <div class="box">
                <a href="forum.html">Forum</a>
                <!-- Ajoutez d'autres liens ici -->
            </div>
        </div>
        <div class="statistics">
            <p></p>
            <p></p>
        </div>
    <div class="container">
        <div class="header">Send your solution.</div>
        <div class="content">
            <h3>This page is online on 22/7/2024</h3>
            <div class="box">
                <a href="submitproblem.html">Send your solution</a>
                <!-- Ajoutez d'autres liens ici -->
            </div>
        </div>
    </div>
  </div>
    <script>
        function togglePanel() {
            var panel = document.getElementById("slidingPanel");
            var overlay = document.getElementById("overlay");
            if (panel.classList.contains("inactive")) {
                panel.classList.remove("inactive");
                panel.classList.add("active");
                overlay.classList.add("active");
            } else {
                panel.classList.remove("active");
                panel.classList.add("inactive");
                overlay.classList.remove("active");
            }
        }

        function toggleAnswer(id) {
            var answer = document.getElementById("answer" + id);
            answer.style.display = answer.style.display === "none" || answer.style.display === "" ? "block" : "none";
        }
    </script>
</body>
</html>

