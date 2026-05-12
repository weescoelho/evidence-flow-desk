import { describe, expect, it } from "vitest";

import { parseGitCommandError } from "./parse-git-error";

describe("parseGitCommandError", () => {
  it("lê objeto com code e message", () => {
    expect(
      parseGitCommandError({ code: "x", message: "y" })
    ).toEqual({ code: "x", message: "y" });
  });

  it("interpreta JSON em string", () => {
    expect(
      parseGitCommandError('{"code":"not_a_git_repository","message":"nope"}')
    ).toEqual({ code: "not_a_git_repository", message: "nope" });
  });

  it("devolve null para formato desconhecido", () => {
    expect(parseGitCommandError("plain")).toBeNull();
  });
});
