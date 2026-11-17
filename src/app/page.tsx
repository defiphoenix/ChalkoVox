/**
 * Public landing page.
 * Shows the product proposition and a faithful mini preview built from the
 * same whiteboard renderer used in the tutor.
 */
import Link from "next/link";
import { ArrowRight, AudioLines, MessagesSquare, PenLine, Sparkles } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Whiteboard } from "@/components/whiteboard/Whiteboard";
import { DEMO_LESSON } from "@/lib/lesson/demo";
import { getServerUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getServerUser();
  const demoStep = DEMO_LESSON.steps[0];

  return (
    <div>
      <header className="landing-header">
        <Wordmark />
        <nav className="landing-nav" aria-label="Primary">
          <a href="#how-it-works">How it works</a>
          <a href="#board">The board</a>
          <Link href="/tutor">Open studio</Link>
        </nav>
        <div className="landing-actions">
          {user ? (
            <Link className="btn btn-primary" href="/tutor">
              Continue learning <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link className="btn btn-ghost" href="/login">
                Sign in
              </Link>
              <Link className="btn btn-primary" href="/signup">
                Start learning
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="landing-main">
        <section className="hero">
          <div>
            <span className="hero-badge">
              <Sparkles size={13} /> AI whiteboard tutor
            </span>
            <h1>
              See the idea.
              <br />
              <span>Then understand it.</span>
            </h1>
            <p className="hero-lead">
              Ask any topic. Chalkovox draws a step-by-step explanation on a whiteboard, talks you through it,
              and answers follow-up questions in a conversation beside the board.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/tutor">
                Open the studio <ArrowRight size={16} />
              </Link>
              <a className="btn btn-ghost" href="#board">
                See a board
              </a>
            </div>
            <div className="hero-meta">
              <span>
                <PenLine size={13} /> Visual reasoning
              </span>
              <span>
                <AudioLines size={13} /> Voice in &amp; out
              </span>
              <span>
                <MessagesSquare size={13} /> Grounded chat
              </span>
            </div>
          </div>

          <div className="hero-preview" id="board">
            <span className="hero-sticker">Lessons you can see</span>
            <div className="preview-window">
              <div className="preview-bar" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div className="preview-body">
                <div className="preview-board">
                  <h3>{demoStep.title}</h3>
                  <p className="preview-sub">{DEMO_LESSON.title} · Mathematics</p>
                  <Whiteboard elements={demoStep.board.elements} label="Preview of a triangle area whiteboard" />
                </div>
                <div className="preview-chat">
                  <div className="preview-chat-head">
                    <Sparkles size={12} color="#6C4CF1" /> AI Tutor
                  </div>
                  <div className="preview-bubble">
                    Think of a rectangle around this triangle. What fraction of that rectangle does the triangle
                    fill?
                  </div>
                  <div className="preview-bubble" style={{ background: "#fff", border: "1px solid #eaecf0" }}>
                    Half of it — the diagonal cuts it into two equal pieces.
                  </div>
                  <div className="preview-pill">Try it yourself</div>
                  <div className="preview-pill">Explain with a visual</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="feature-strip">
          <article className="feature">
            <div className="feature-icon">
              <PenLine size={17} />
            </div>
            <h3>Draws the reasoning</h3>
            <p>Every lesson is a sequence of boards: formulas, shapes, arrows and labels that build one idea at a time.</p>
          </article>
          <article className="feature">
            <div className="feature-icon">
              <AudioLines size={17} />
            </div>
            <h3>Speaks and listens</h3>
            <p>Listen to any step read aloud with Deepgram, or ask your next question by voice instead of typing.</p>
          </article>
          <article className="feature">
            <div className="feature-icon">
              <MessagesSquare size={17} />
            </div>
            <h3>Stays on the board</h3>
            <p>The tutor sees the current step, so answers refer to what you are looking at and check your understanding.</p>
          </article>
        </section>
      </main>

      <footer className="landing-foot">
        Chalkovox · Built with Next.js, Supabase, OpenRouter and Deepgram
      </footer>
    </div>
  );
}
