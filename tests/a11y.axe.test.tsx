// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as axeMatchers from "vitest-axe/matchers";
import type { AxeMatchers } from "vitest-axe/matchers";
import { Mail, Plus, Search } from "lucide-react";
import { AppearanceCard } from "../src/AppearanceCard";
import { Badge } from "../src/Badge";
import { Button } from "../src/Button";
import { CountBadge } from "../src/CountBadge";
import { DataTable, type Column } from "../src/DataTable";
import { EmptyState } from "../src/EmptyState";
import { ErrorState } from "../src/ErrorState";
import { IconButton } from "../src/IconButton";
import { Modal } from "../src/Modal";
import { PageHeader } from "../src/PageHeader";
import { RaiseYourHandModal } from "../src/RaiseYourHand";
import { ThemeProvider } from "../src/ThemeProvider";
import { Field, Input, RequiredNote, Select, Textarea } from "../src/form";
import { AskStella } from "../src/crs/AskStella";
import { OutreachBuilder } from "../src/crs/OutreachBuilder";
import { SendEmail } from "../src/crs/SendEmail";
import type { StudentSummary } from "../src/crs/types";

expect.extend(axeMatchers);
declare module "vitest" {
  interface Assertion extends AxeMatchers {}
}

afterEach(cleanup);

/*
 * Automated accessibility scan of the shared primitives (HECVAT / WCAG 2.1 AA). Every hub that
 * consumes hub-kit inherits what passes here, so a regression in a primitive fails once, in the
 * package, rather than once per hub. axe-core runs against jsdom, which has no layout engine:
 * `color-contrast` is disabled below because it needs computed colors and element geometry that
 * jsdom never produces (contrast is held by the theme tokens, checked by hand against the design
 * notes). Everything else in the WCAG A/AA rule set runs.
 */
const AXE_OPTIONS = {
  runOnly: { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
  rules: {
    // jsdom has no layout, so axe cannot resolve the painted colors behind the text.
    "color-contrast": { enabled: false },
  },
};

/** Scan the whole document so portaled content (FilterMenu) is included. */
async function expectClean() {
  expect(await axe(document.body, AXE_OPTIONS)).toHaveNoViolations();
}

type Row = { id: string; name: string; status: string };
const ROWS: Row[] = Array.from({ length: 10 }, (_, i) => ({
  id: `r${i}`,
  name: `Person ${i}`,
  status: i % 2 ? "Active" : "Invited",
}));
const COLUMNS: Column<Row>[] = [
  { key: "name", header: "Name", render: (r) => r.name },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge tone={r.status === "Active" ? "green" : "muted"}>{r.status}</Badge>,
    filter: { options: ["Active", "Invited"], value: (r) => r.status },
  },
];

const STUDENTS: StudentSummary[] = [
  {
    student_guid: "s1",
    display_name: "Ada Lovelace",
    major: "Mathematics",
    status: "On Track",
    archetype: "Ascending",
    engagement_play: null,
    momentum_direction: "up",
    year_in_program: 2,
    last_activity_at: null,
    last_activity_type: null,
    primary_risk_factor: null,
    recommended_next_step: null,
  },
  {
    student_guid: "s2",
    display_name: "Grace Hopper",
    major: null,
    status: "At Risk",
    archetype: "Going Dark",
    engagement_play: null,
    momentum_direction: "down",
    year_in_program: 3,
    last_activity_at: null,
    last_activity_type: null,
    primary_risk_factor: null,
    recommended_next_step: null,
  },
];

const drafts = vi.fn(async (guids: string[]) =>
  guids.map((g) => ({ student_guid: g, display_name: null, archetype: null, subject: `Hi ${g}`, body: "Body" })),
);
const askStella = vi.fn(async () => ({ reply: "Here is my read.", session_id: "sess" }));

describe("axe: primitives", () => {
  it("Button, all four variants, plus a disabled one", async () => {
    render(
      <div>
        <Button>Save</Button>
        <Button variant="secondary">Duplicate</Button>
        <Button variant="ghost">Export</Button>
        <Button variant="subtle">Cancel</Button>
        <Button size="sm" disabled>
          Saving…
        </Button>
      </div>,
    );
    await expectClean();
  });

  it("IconButton", async () => {
    render(
      <div>
        <IconButton label="Add member">
          <Plus className="size-4" aria-hidden />
        </IconButton>
        <IconButton label="Search" tone="bright">
          <Search className="size-4" aria-hidden />
        </IconButton>
      </div>,
    );
    await expectClean();
  });

  it("Modal, open, with a title and a form inside", async () => {
    render(
      <Modal
        open
        onClose={() => {}}
        title="Invite a colleague"
        footer={
          <>
            <Button variant="subtle">Cancel</Button>
            <Button>Send Invite</Button>
          </>
        }
      >
        <form>
          <Field label="Email" hint="Their school address.">
            <Input type="email" />
          </Field>
          <Field label="Role">
            <Select defaultValue="advisor">
              <option value="advisor">Advisor</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
        </form>
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Invite a colleague" })).toBeTruthy();
    await expectClean();
  });

  it("Field with Input, Textarea and Select; required; with hint; with error; RequiredNote", async () => {
    render(
      <form>
        <RequiredNote />
        <Field label="Name" required>
          <Input defaultValue="Ada" />
        </Field>
        <Field label="Notes" hint="Visible to the student.">
          <Textarea rows={3} />
        </Field>
        <Field label="Department" error="Choose a department.">
          <Select defaultValue="">
            <option value="">Select…</option>
            <option value="cs">Computer Science</option>
          </Select>
        </Field>
        <Field label="Phone" hint="Digits only." error="Enter a phone number.">
          <Input type="tel" />
        </Field>
      </form>,
    );
    await expectClean();
  });

  it("DataTable with rows, onRowClick, search, a column filter and a pager", async () => {
    render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(r) => r.id}
        onRowClick={() => {}}
        search={{ placeholder: "Search members", label: "Search members", match: (r, q) => r.name.toLowerCase().includes(q) }}
        pageSize={4}
      />,
    );
    await expectClean();
    // With the search box filled (clear button visible) and the filter menu open (portaled).
    fireEvent.change(screen.getByLabelText("Search members"), { target: { value: "Person" } });
    const filterButton = screen.getByLabelText("Filter Status");
    fireEvent.click(filterButton);
    expect(screen.getByText("Invited", { selector: "button" })).toBeTruthy();
    await expectClean();
    // Escape closes the menu and puts focus back on the filter button (keyboard way out).
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Invited", { selector: "button" })).toBeNull();
    expect(document.activeElement).toBe(filterButton);
  });

  it("Badge and CountBadge", async () => {
    render(
      <div>
        <Badge tone="brand">Beta</Badge>
        <Badge tone="red">Overdue</Badge>
        <CountBadge count={3} />
      </div>,
    );
    await expectClean();
  });

  it("EmptyState and ErrorState", async () => {
    render(
      <main>
        <EmptyState
          icon={Mail}
          title="No requests yet"
          description="Requests you raise will show up here."
          action={<Button size="sm">Raise Your Hand</Button>}
        />
        <ErrorState onRetry={() => {}} action={<Button variant="ghost">Raise Your Hand</Button>} />
      </main>,
    );
    await expectClean();
  });

  it("PageHeader with an info hint and an action", async () => {
    render(
      <main>
        <PageHeader title="Members" info="Everyone with a seat at this school." action={<Button>Add Member</Button>} />
      </main>,
    );
    await expectClean();
  });

  it("AppearanceCard", async () => {
    render(
      <ThemeProvider>
        <AppearanceCard />
      </ThemeProvider>,
    );
    await expectClean();
  });

  it("RaiseYourHand modal, open: fork step and describe step", async () => {
    render(
      <RaiseYourHandModal
        open
        onClose={() => {}}
        actionKey="team.members.list"
        onSubmit={async () => ({ outcome: "recorded" as const })}
      />,
    );
    await expectClean();
    fireEvent.click(screen.getByText("Something is broken"));
    expect(screen.getByRole("textbox")).toBeTruthy();
    await expectClean();
  });
});

describe("axe: CRS overlays", () => {
  it("AskStella, open, with the opening reply in the thread", async () => {
    render(<AskStella studentGuid="s1" firstName="Ada" archetype="Ascending" askStella={askStella} />);
    const trigger = screen.getByRole("button", { name: /^Ask Stella$/ });
    trigger.focus(); // fireEvent.click does not move focus, so give the trap something to return to
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: /Ask Stella/ });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    await screen.findByText("Here is my read.");
    await expectClean();
    // Focus moved into the panel on open; Escape closes it and focus returns to the trigger.
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("OutreachBuilder, each of its three steps", async () => {
    const onClose = vi.fn();
    render(<OutreachBuilder students={STUDENTS} onClose={onClose} generateOutreachDrafts={drafts} />);
    const dialog = screen.getByRole("dialog", { name: /Generate Student Outreach/ });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.contains(document.activeElement)).toBe(true);
    await expectClean();
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    await expectClean();
    fireEvent.click(screen.getByRole("button", { name: /Broadcast/ }));
    expect(screen.getByLabelText("Subject Line")).toBeTruthy();
    await expectClean();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("SendEmail, open", async () => {
    render(<SendEmail studentGuid="s1" firstName="Ada" email="ada@example.edu" generateOutreachDrafts={drafts} />);
    const trigger = screen.getByRole("button", { name: /Send Email to Ada/ });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: /Send Email to Ada/ });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(screen.getByLabelText("Subject")).toBeTruthy();
    expect(screen.getByLabelText("Message")).toBeTruthy();
    await expectClean();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
