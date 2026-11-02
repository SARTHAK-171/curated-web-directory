// custom-select.js — accessible custom UI for native select data controls.

const instances = new Set();

class CustomSelect {
  constructor(select) {
    this.select = select;
    this.options = [];
    this.activeIndex = -1;
    this.typeahead = "";
    this.typeaheadTimer = null;
    this.wrapper = document.createElement("div");
    this.wrapper.className = "custom-select";
    this.wrapper.dataset.customSelect = "";
    this.trigger = document.createElement("button");
    this.trigger.type = "button";
    this.trigger.className = "custom-select-trigger";
    this.trigger.id = `${select.id}-trigger`;
    this.trigger.setAttribute("role", "combobox");
    this.trigger.setAttribute("aria-haspopup", "listbox");
    this.trigger.setAttribute("aria-expanded", "false");
    this.trigger.setAttribute("aria-controls", `${select.id}-listbox`);
    this.menu = document.createElement("div");
    this.menu.className = "custom-select-menu";
    this.menu.id = `${select.id}-listbox`;
    this.menu.setAttribute("role", "listbox");
    this.menu.setAttribute("aria-labelledby", `${select.id}-label`);
    this.menu.hidden = true;

    const arrow = document.createElement("span");
    arrow.className = "custom-select-chevron";
    arrow.setAttribute("aria-hidden", "true");
    this.trigger.append(arrow);

    const label = document.querySelector(`label[for="${CSS.escape(select.id)}"]`);
    if (label) {
      label.id = `${select.id}-label`;
      this.trigger.setAttribute("aria-labelledby", label.id);
      label.htmlFor = this.trigger.id;
    }

    select.classList.add("custom-select-native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    select.insertAdjacentElement("beforebegin", this.wrapper);
    this.wrapper.append(select, this.trigger, this.menu);

    this.trigger.addEventListener("click", () => this.toggle());
    this.trigger.addEventListener("keydown", (event) => this.onKeyDown(event));
    this.menu.addEventListener("click", (event) => {
      const option = event.target.closest("[role='option']");
      if (!option || !this.menu.contains(option)) return;
      this.choose(Number(option.dataset.index));
    });
    this.select.addEventListener("change", () => this.refresh());
    this.observer = new MutationObserver(() => this.refresh());
    this.observer.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
    this.refresh();
    instances.add(this);
  }

  refresh() {
    this.options = [...this.select.options];
    this.trigger.disabled = this.select.disabled;
    this.trigger.classList.toggle("is-disabled", this.select.disabled);
    this.trigger.replaceChildren();
    const value = document.createElement("span");
    value.className = "custom-select-value";
    const selected = this.options[this.select.selectedIndex];
    value.textContent = selected?.textContent || "Select an option";
    this.trigger.append(value);
    const arrow = document.createElement("span");
    arrow.className = "custom-select-chevron";
    arrow.setAttribute("aria-hidden", "true");
    this.trigger.append(arrow);
    this.menu.replaceChildren();
    this.options.forEach((option, index) => {
      const item = document.createElement("div");
      item.className = "custom-select-option";
      item.setAttribute("role", "option");
      item.id = `${this.select.id}-option-${index}`;
      item.dataset.index = String(index);
      item.textContent = option.textContent;
      item.setAttribute("aria-selected", String(index === this.select.selectedIndex));
      item.setAttribute("aria-disabled", String(option.disabled));
      if (option.disabled) item.classList.add("is-disabled");
      this.menu.append(item);
    });
    this.trigger.setAttribute("aria-activedescendant", this.options.length
      ? `${this.select.id}-option-${Math.max(0, this.select.selectedIndex)}`
      : "");
    this.setActive(this.select.selectedIndex >= 0 ? this.select.selectedIndex : 0, false);
  }

  setActive(index, scroll = true) {
    if (!this.options.length) return;
    this.activeIndex = Math.max(0, Math.min(index, this.options.length - 1));
    this.menu.querySelectorAll("[role='option']").forEach((item, i) => {
      item.classList.toggle("is-active", i === this.activeIndex);
    });
    this.trigger.setAttribute("aria-activedescendant", `${this.select.id}-option-${this.activeIndex}`);
    if (scroll && this.menu.querySelector(`#${CSS.escape(`${this.select.id}-option-${this.activeIndex}`)}`)) {
      this.menu.querySelector(`#${CSS.escape(`${this.select.id}-option-${this.activeIndex}`)}`).scrollIntoView({ block: "nearest" });
    }
  }

  open() {
    if (this.select.disabled || this.menu.hidden) {
      if (this.select.disabled) return;
      this.menu.hidden = false;
      this.wrapper.classList.add("is-open");
      this.trigger.setAttribute("aria-expanded", "true");
      this.setActive(Math.max(0, this.select.selectedIndex), false);
    }
  }

  close() {
    if (this.menu.hidden) return;
    this.menu.hidden = true;
    this.wrapper.classList.remove("is-open");
    this.trigger.setAttribute("aria-expanded", "false");
  }

  toggle() {
    if (this.menu.hidden) this.open();
    else this.close();
  }

  choose(index) {
    const option = this.options[index];
    if (!option || option.disabled) return;
    this.select.selectedIndex = index;
    this.select.dispatchEvent(new Event("change", { bubbles: true }));
    this.close();
    this.trigger.focus();
  }

  onKeyDown(event) {
    const key = event.key;
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(key)) {
      event.preventDefault();
    }
    if (key === "Escape") {
      this.close();
      return;
    }
    if (key === "ArrowDown" || key === "ArrowUp") {
      if (this.menu.hidden) this.open();
      const direction = key === "ArrowDown" ? 1 : -1;
      this.setActive((this.activeIndex + direction + this.options.length) % this.options.length);
      return;
    }
    if (key === "Home" || key === "End") {
      this.open();
      this.setActive(key === "Home" ? 0 : this.options.length - 1);
      return;
    }
    if (key === "Enter" || key === " ") {
      if (this.menu.hidden) this.open();
      else this.choose(this.activeIndex);
      return;
    }
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.typeahead += key.toLocaleLowerCase();
      clearTimeout(this.typeaheadTimer);
      this.typeaheadTimer = setTimeout(() => { this.typeahead = ""; }, 650);
      const start = Math.max(0, this.select.selectedIndex + 1);
      const ordered = [...this.options.slice(start), ...this.options.slice(0, start)];
      const match = ordered.find((option) => !option.disabled &&
        option.textContent.trim().toLocaleLowerCase().startsWith(this.typeahead));
      if (match) {
        const index = this.options.indexOf(match);
        this.open();
        this.setActive(index);
      }
    }
  }
}

export function initCustomSelects(selects) {
  for (const select of selects) {
    if (select && !select.dataset.customSelectReady) {
      select.dataset.customSelectReady = "true";
      new CustomSelect(select);
    }
  }
  document.addEventListener("pointerdown", (event) => {
    for (const instance of instances) {
      if (!instance.wrapper.contains(event.target)) instance.close();
    }
  });
}

export function refreshCustomSelects() {
  for (const instance of instances) instance.refresh();
}
