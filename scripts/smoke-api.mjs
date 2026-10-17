// Plays a full game against a running server and checks the integrity rules.
// Usage: node scripts/smoke-api.mjs [baseUrl]   (default http://localhost:3000)
// Pass --slow to also check the server-side timeout (waits ~13s).

const base = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const slow = process.argv.includes("--slow");

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

function check(label, condition, detail) {
  console.log(`${condition ? "✔" : "✘"} ${label}`);
  if (!condition) {
    console.error(detail);
    process.exitCode = 1;
  }
}

const start = await call("POST", "/api/game/start");
check("start → 201", start.status === 201, start);
const { sessionId } = start.body;

const early = await call("GET", `/api/game/result?sessionId=${sessionId}`);
check("result before finishing → 409", early.status === 409, early);

const unserved = await call("POST", "/api/game/answer", { sessionId, index: 0, answer: true });
check("answer before next → 409", unserved.status === 409, unserved);

for (let index = 0; index < 15; index++) {
  const next = await call("POST", "/api/game/next", { sessionId });
  check(`next #${index} → 200, no answer leaked`, next.status === 200 && next.body.index === index
    && !("answer" in next.body) && !("explanation" in next.body), next);

  const again = await call("POST", "/api/game/next", { sessionId });
  check(`next #${index} repeated returns same question`, again.body.id === next.body.id, again);

  if (slow && index === 0) {
    await new Promise((r) => setTimeout(r, 13_000));
  }
  const answer = await call("POST", "/api/game/answer", { sessionId, index, answer: true });
  check(`answer #${index} → 200`, answer.status === 200 && answer.body.isLast === (index === 14), answer);
  if (slow && index === 0) {
    check("late answer counts as timeout", answer.body.timedOut === true && answer.body.correct === false, answer);
  }

  const dup = await call("POST", "/api/game/answer", { sessionId, index, answer: true });
  check(`duplicate answer #${index} → 409`, dup.status === 409, dup);
}

const result = await call("GET", `/api/game/result?sessionId=${sessionId}`);
check("result → 200", result.status === 200 && result.body.saved === false, result);
console.log(`   ${result.body.correctCount}/15 in ${result.body.totalTimeMs} ms`);

const bad = await call("POST", "/api/ranking", { sessionId, nickname: "x" });
check("invalid nickname → 400", bad.status === 400, bad);

const saved = await call("POST", "/api/ranking", { sessionId, nickname: `smoke-${Date.now() % 1e6}` });
check("save → 201 with position", saved.status === 201 && saved.body.position >= 1, saved);

const twice = await call("POST", "/api/ranking", { sessionId, nickname: "smoke-again" });
check("save twice → 409", twice.status === 409, twice);

const ranking = await call("GET", `/api/ranking?highlight=${saved.body.scoreId}`);
check("ranking highlights saved score", ranking.status === 200
  && ranking.body.highlighted?.id === saved.body.scoreId
  && ranking.body.highlighted.position === saved.body.position, ranking);
