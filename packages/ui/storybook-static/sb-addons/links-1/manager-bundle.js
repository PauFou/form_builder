try {
  (() => {
    var y = __STORYBOOK_API__,
      {
        ActiveTabs: S,
        Consumer: c,
        ManagerContext: E,
        Provider: O,
        RequestResponseError: U,
        addons: n,
        combineParameters: T,
        controlOrMetaKey: D,
        controlOrMetaSymbol: A,
        eventMatchesShortcut: f,
        eventToShortcut: h,
        experimental_MockUniversalStore: v,
        experimental_UniversalStore: R,
        experimental_requestResponse: I,
        experimental_useUniversalStore: P,
        isMacLike: g,
        isShortcutTaken: x,
        keyToSymbol: C,
        merge: M,
        mockChannel: N,
        optionOrAltSymbol: B,
        shortcutMatchesShortcut: K,
        shortcutToHumanString: V,
        types: q,
        useAddonState: G,
        useArgTypes: L,
        useArgs: Y,
        useChannel: $,
        useGlobalTypes: H,
        useGlobals: Q,
        useParameter: j,
        useSharedState: w,
        useStoryPrepared: z,
        useStorybookApi: F,
        useStorybookState: J,
      } = __STORYBOOK_API__;
    var e = "storybook/links",
      u = { NAVIGATE: `${e}/navigate`, REQUEST: `${e}/request`, RECEIVE: `${e}/receive` };
    n.register(e, (o) => {
      o.on(u.REQUEST, ({ kind: d, name: l }) => {
        let m = o.storyId(d, l);
        o.emit(u.RECEIVE, m);
      });
    });
  })();
} catch (e) {
  console.error("[Storybook] One of your manager-entries failed: " + import.meta.url, e);
}
