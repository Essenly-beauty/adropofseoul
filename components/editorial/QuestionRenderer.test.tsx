import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionRenderer } from "./QuestionRenderer";
import type { QuizQuestionDef } from "@/lib/profile/quiz-definition";

function q(overrides: Partial<QuizQuestionDef>): QuizQuestionDef {
  return {
    key: "k",
    type: "single_select",
    content: "Prompt?",
    isRequired: true,
    allowsMultiple: false,
    options: [],
    ...overrides,
  };
}

describe("QuestionRenderer", () => {
  it("renders an info step as plain text with no inputs", () => {
    const onChange = vi.fn();
    const { container } = render(
      <QuestionRenderer
        question={q({ key: "i", type: "info", content: "Just so you know." })}
        value={null}
        onChange={onChange}
      />
    );
    expect(screen.getByText("Just so you know.")).toBeTruthy();
    expect(container.querySelectorAll("input, textarea").length).toBe(0);
  });

  it("renders help text when provided", () => {
    render(
      <QuestionRenderer
        question={q({
          type: "scale",
          content: "How often?",
          helpText: "A rough sense is fine.",
        })}
        value={null}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("A rough sense is fine.")).toBeTruthy();
  });

  it("text: labels the textarea, caps length, and reports changes", () => {
    const onChange = vi.fn();
    render(
      <QuestionRenderer
        question={q({ key: "note", type: "text", content: "Anything else?" })}
        value=""
        onChange={onChange}
      />
    );
    const box = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(box.getAttribute("maxlength")).toBe("500");
    // label is associated (clicking the label focuses the field)
    expect(screen.getByText("Anything else?").getAttribute("for")).toBe(
      "q-note"
    );
    fireEvent.change(box, { target: { value: "dry ends" } });
    expect(onChange).toHaveBeenCalledWith("dry ends");
  });

  it("scale: renders 0–5 and reports the chosen number", () => {
    const onChange = vi.fn();
    render(
      <QuestionRenderer
        question={q({ key: "heat", type: "scale", content: "How often?" })}
        value={null}
        onChange={onChange}
      />
    );
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBe(6);
    fireEvent.click(screen.getByRole("radio", { name: "3" }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("single_select: reports the option key, not the label", () => {
    const onChange = vi.fn();
    render(
      <QuestionRenderer
        question={q({
          key: "wash",
          type: "single_select",
          content: "How often do you wash?",
          options: [
            { key: "daily", value: "daily", label: "Every day" },
            { key: "weekly", value: "weekly_or_less", label: "Weekly or less" },
          ],
        })}
        value={null}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("radio", { name: "Every day" }));
    expect(onChange).toHaveBeenCalledWith("daily");
  });

  it("multi_select: toggles keys on and off in the array", () => {
    const onChange = vi.fn();
    const question = q({
      key: "concerns",
      type: "multi_select",
      allowsMultiple: true,
      content: "Which apply?",
      options: [
        { key: "frizz", value: "frizz", label: "Frizz" },
        { key: "dry", value: "dry_ends", label: "Dry ends" },
      ],
    });
    const { rerender } = render(
      <QuestionRenderer
        question={question}
        value={["frizz"]}
        onChange={onChange}
      />
    );
    // "frizz" already selected → clicking it removes it
    fireEvent.click(screen.getByRole("checkbox", { name: "Frizz" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    // adding a second key preserves the first
    onChange.mockClear();
    rerender(
      <QuestionRenderer
        question={question}
        value={["frizz"]}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Dry ends" }));
    expect(onChange).toHaveBeenLastCalledWith(["frizz", "dry"]);
  });

  it("checkbox vs radio input type follows the question type", () => {
    const opts = [{ key: "a", value: "a", label: "A" }];
    const { rerender } = render(
      <QuestionRenderer
        question={q({ type: "single_select", options: opts })}
        value={null}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole("radio", { name: "A" })).toBeTruthy();
    rerender(
      <QuestionRenderer
        question={q({
          type: "multi_select",
          allowsMultiple: true,
          options: opts,
        })}
        value={null}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole("checkbox", { name: "A" })).toBeTruthy();
  });
});

describe("QuestionRenderer exclusive multi-select options", () => {
  const concerns = q({
    key: "scalp_concerns",
    type: "multi_select",
    content: "Which scalp concerns do you experience regularly?",
    allowsMultiple: true,
    validation: { exclusiveOptionKeys: ["none"] },
    options: [
      { key: "none", value: "none", label: "None" },
      { key: "itching", value: "itching", label: "Itching" },
      { key: "oiliness", value: "oiliness", label: "Excess oiliness" },
    ],
  });

  it("clears the other options when an exclusive option is picked", () => {
    const onChange = vi.fn();
    render(
      <QuestionRenderer
        question={concerns}
        value={["itching", "oiliness"]}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "None" }));
    expect(onChange).toHaveBeenCalledWith(["none"]);
  });

  it("drops the exclusive option when another option is picked", () => {
    const onChange = vi.fn();
    render(
      <QuestionRenderer
        question={concerns}
        value={["none"]}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Itching" }));
    expect(onChange).toHaveBeenCalledWith(["itching"]);
  });

  it("deselects an exclusive option that is clicked again", () => {
    const onChange = vi.fn();
    render(
      <QuestionRenderer
        question={concerns}
        value={["none"]}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "None" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
