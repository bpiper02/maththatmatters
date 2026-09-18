import { DEFAULT_CONFIG } from './lib/questions';
import { generateQuestion } from './lib/questions';

function App() {
  const sample = generateQuestion('percentages', DEFAULT_CONFIG);
  return (
    <main className="boot">
      <section>
        <strong>Math That Matters</strong>
        <p>Sprint 1 engine ready.</p>
        <code>{sample.prompt}</code>
      </section>
    </main>
  );
}

export default App;
