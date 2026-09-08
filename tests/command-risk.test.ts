import assert from "node:assert/strict";
import { test } from "node:test";
import { assessCommandRisk } from "../src/lib/command-risk.ts";

test("flags destructive commands", () => {
  assert.equal(assessCommandRisk("git reset --hard HEAD").risk, "destructive");
  assert.equal(assessCommandRisk("docker system prune -a").risk, "destructive");
  assert.equal(assessCommandRisk("shutdown /s /t 0").risk, "destructive");
});

test("flags high-impact commands", () => {
  assert.equal(assessCommandRisk("systemctl restart nginx").risk, "caution");
  assert.equal(assessCommandRisk("chown -R user:group /srv/app").risk, "caution");
  assert.equal(assessCommandRisk("git push origin main --force-with-lease").risk, "caution");
});

test("does not warn on read-only commands", () => {
  assert.equal(assessCommandRisk("ip route show").risk, "safe");
  assert.equal(assessCommandRisk("iptables -L -v -n").risk, "safe");
});
