// ============================================================
// @mastors/adapter-vue — Vue 3 Adapter
// Mastors Intent-Based Styling Framework v0.1.0
//
// Provides useIntent() composable, v-intent directive,
// and the MastorsComponent for Vue 3 applications.
// ============================================================

import { computed, defineComponent, h, ref } from "vue";
import type { DirectiveBinding, App, Plugin, PropType } from "vue";
import { intentClass, intent } from "@mastors/api";
import type { IntentContext } from "@mastors/types";

// ── useIntent() Composable ───────────────────────────────────

/**
 * Vue 3 composable that resolves an intent identifier to a CSS class string.
 *
 * @example
 * <script setup>
 * import { useIntent } from "@mastors/adapter-vue";
 * const cardClass = useIntent("card.elevated.interactive");
 * </script>
 * <template>
 *   <div :class="cardClass">...</div>
 * </template>
 */
export function useIntent(raw: string, context: IntentContext = {}): { value: string } {
  return computed(() => {
    try {
      return intentClass(raw, context);
    } catch {
      return `m-intent-${raw.replace(/\./g, "-")}`;
    }
  });
}

// ── v-intent Directive ───────────────────────────────────────

/**
 * Vue directive that applies Mastors intent classes to elements.
 *
 * @example
 * <div v-intent="'card.elevated.interactive'">...</div>
 */
export const vIntent = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    const raw = binding.value;
    if (!raw) return;
    try {
      const classes = intentClass(raw).split(" ");
      el.classList.add(...classes);
    } catch {
      el.classList.add(`m-intent-${raw.replace(/\./g, "-")}`);
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string>) {
    if (binding.value === binding.oldValue) return;
    // Remove old classes
    if (binding.oldValue) {
      const oldClasses = `m-intent-${binding.oldValue.replace(/\./g, "-")}`;
      el.classList.remove(oldClasses);
    }
    if (binding.value) {
      try {
        const classes = intentClass(binding.value).split(" ");
        el.classList.add(...classes);
      } catch {
        el.classList.add(`m-intent-${binding.value.replace(/\./g, "-")}`);
      }
    }
  },
};

// ── MastorsComponent ─────────────────────────────────────────

/**
 * A flexible Vue component that applies Mastors intent to any element.
 *
 * @example
 * <MastorsComponent as="div" intent="card.elevated.interactive">
 *   Content here
 * </MastorsComponent>
 */
export const MastorsComponent = defineComponent({
  name: "MastorsComponent",
  props: {
    as: {
      type: String as PropType<string>,
      default: "div",
    },
    intent: {
      type: String as PropType<string>,
      required: true,
    },
    intentContext: {
      type: Object as PropType<IntentContext>,
      default: () => ({}),
    },
    class: {
      type: String,
      default: "",
    },
  },
  setup(props, { slots, attrs }) {
    const mastorsClass = computed(() => {
      try {
        return intentClass(props.intent, props.intentContext);
      } catch {
        return `m-intent-${props.intent.replace(/\./g, "-")}`;
      }
    });

    return () => {
      const combined = [mastorsClass.value, props.class].filter(Boolean).join(" ");
      return h(props.as, { ...attrs, class: combined }, slots.default?.());
    };
  },
});

// ── Mastors Vue Plugin ────────────────────────────────────────

/**
 * Vue plugin that registers the v-intent directive and MastorsComponent globally.
 *
 * @example
 * import { MastorsPlugin } from "@mastors/adapter-vue";
 * app.use(MastorsPlugin);
 */
export const MastorsPlugin: Plugin = {
  install(app: App) {
    app.directive("intent", vIntent);
    app.component("MastorsComponent", MastorsComponent);
  },
};

export type { IntentContext };
