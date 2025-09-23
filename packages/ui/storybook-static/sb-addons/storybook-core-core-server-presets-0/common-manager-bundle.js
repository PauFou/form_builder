try {
  (() => {
    var f = __STORYBOOK_API__,
      {
        ActiveTabs: O,
        Consumer: T,
        ManagerContext: h,
        Provider: g,
        RequestResponseError: U,
        addons: n,
        combineParameters: v,
        controlOrMetaKey: A,
        controlOrMetaSymbol: D,
        eventMatchesShortcut: x,
        eventToShortcut: P,
        experimental_MockUniversalStore: M,
        experimental_UniversalStore: R,
        experimental_requestResponse: C,
        experimental_useUniversalStore: w,
        isMacLike: B,
        isShortcutTaken: E,
        keyToSymbol: I,
        merge: K,
        mockChannel: N,
        optionOrAltSymbol: G,
        shortcutMatchesShortcut: L,
        shortcutToHumanString: Y,
        types: q,
        useAddonState: F,
        useArgTypes: H,
        useArgs: j,
        useChannel: V,
        useGlobalTypes: z,
        useGlobals: J,
        useParameter: Q,
        useSharedState: W,
        useStoryPrepared: X,
        useStorybookApi: Z,
        useStorybookState: $,
      } = __STORYBOOK_API__;
    var m = (() => {
        let e;
        return (
          typeof window < "u"
            ? (e = window)
            : typeof globalThis < "u"
              ? (e = globalThis)
              : typeof window < "u"
                ? (e = window)
                : typeof self < "u"
                  ? (e = self)
                  : (e = {}),
          e
        );
      })(),
      a = "tag-filters",
      _ = "static-filter";
    n.register(a, (e) => {
      let d = Object.entries(m.TAGS_OPTIONS ?? {}).reduce((o, r) => {
        let [t, p] = r;
        return (p.excludeFromSidebar && (o[t] = !0), o);
      }, {});
      e.experimental_setFilter(_, (o) => {
        let r = o.tags ?? [];
        return (r.includes("dev") || o.type === "docs") && r.filter((t) => d[t]).length === 0;
      });
    });
  })();
} catch (e) {
  console.error("[Storybook] One of your manager-entries failed: " + import.meta.url, e);
}
