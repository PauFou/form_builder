try {
  (() => {
    var n = __REACT__,
      {
        Children: se,
        Component: ue,
        Fragment: ie,
        Profiler: pe,
        PureComponent: de,
        StrictMode: ce,
        Suspense: me,
        __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: _e,
        cloneElement: be,
        createContext: Se,
        createElement: ye,
        createFactory: Te,
        createRef: fe,
        forwardRef: ke,
        isValidElement: Oe,
        lazy: ve,
        memo: Ce,
        startTransition: Ie,
        unstable_act: Ee,
        useCallback: k,
        useContext: xe,
        useDebugValue: ge,
        useDeferredValue: Ae,
        useEffect: x,
        useId: Re,
        useImperativeHandle: he,
        useInsertionEffect: De,
        useLayoutEffect: Le,
        useMemo: Be,
        useReducer: Pe,
        useRef: D,
        useState: L,
        useSyncExternalStore: Me,
        useTransition: Ne,
        version: Ue,
      } = __REACT__;
    var Fe = __STORYBOOK_API__,
      {
        ActiveTabs: Ge,
        Consumer: Ke,
        ManagerContext: Ye,
        Provider: $e,
        RequestResponseError: qe,
        addons: g,
        combineParameters: ze,
        controlOrMetaKey: je,
        controlOrMetaSymbol: Ze,
        eventMatchesShortcut: Je,
        eventToShortcut: Qe,
        experimental_MockUniversalStore: Xe,
        experimental_UniversalStore: et,
        experimental_requestResponse: tt,
        experimental_useUniversalStore: ot,
        isMacLike: rt,
        isShortcutTaken: lt,
        keyToSymbol: nt,
        merge: at,
        mockChannel: st,
        optionOrAltSymbol: ut,
        shortcutMatchesShortcut: it,
        shortcutToHumanString: pt,
        types: B,
        useAddonState: dt,
        useArgTypes: ct,
        useArgs: mt,
        useChannel: _t,
        useGlobalTypes: P,
        useGlobals: A,
        useParameter: bt,
        useSharedState: St,
        useStoryPrepared: yt,
        useStorybookApi: M,
        useStorybookState: Tt,
      } = __STORYBOOK_API__;
    var Ct = __STORYBOOK_COMPONENTS__,
      {
        A: It,
        ActionBar: Et,
        AddonPanel: xt,
        Badge: gt,
        Bar: At,
        Blockquote: Rt,
        Button: ht,
        ClipboardCode: Dt,
        Code: Lt,
        DL: Bt,
        Div: Pt,
        DocumentWrapper: Mt,
        EmptyTabContent: Nt,
        ErrorFormatter: Ut,
        FlexBar: Vt,
        Form: wt,
        H1: Ht,
        H2: Wt,
        H3: Ft,
        H4: Gt,
        H5: Kt,
        H6: Yt,
        HR: $t,
        IconButton: N,
        IconButtonSkeleton: qt,
        Icons: R,
        Img: zt,
        LI: jt,
        Link: Zt,
        ListItem: Jt,
        Loader: Qt,
        Modal: Xt,
        OL: eo,
        P: to,
        Placeholder: oo,
        Pre: ro,
        ProgressSpinner: lo,
        ResetWrapper: no,
        ScrollArea: ao,
        Separator: U,
        Spaced: so,
        Span: uo,
        StorybookIcon: io,
        StorybookLogo: po,
        Symbols: co,
        SyntaxHighlighter: mo,
        TT: _o,
        TabBar: bo,
        TabButton: So,
        TabWrapper: yo,
        Table: To,
        Tabs: fo,
        TabsState: ko,
        TooltipLinkList: V,
        TooltipMessage: Oo,
        TooltipNote: vo,
        UL: Co,
        WithTooltip: w,
        WithTooltipPure: Io,
        Zoom: Eo,
        codeCommon: xo,
        components: go,
        createCopyToClipboardFunction: Ao,
        getStoryHref: Ro,
        icons: ho,
        interleaveSeparators: Do,
        nameSpaceClassNames: Lo,
        resetComponents: Bo,
        withReset: Po,
      } = __STORYBOOK_COMPONENTS__;
    var G = { type: "item", value: "" },
      K = (o, t) => ({
        ...t,
        name: t.name || o,
        description: t.description || o,
        toolbar: {
          ...t.toolbar,
          items: t.toolbar.items.map((e) => {
            let r = typeof e == "string" ? { value: e, title: e } : e;
            return (
              r.type === "reset" &&
                t.toolbar.icon &&
                ((r.icon = t.toolbar.icon), (r.hideIcon = !0)),
              { ...G, ...r }
            );
          }),
        },
      }),
      Y = ["reset"],
      $ = (o) => o.filter((t) => !Y.includes(t.type)).map((t) => t.value),
      b = "addon-toolbars",
      q = async (o, t, e) => {
        (e &&
          e.next &&
          (await o.setAddonShortcut(b, {
            label: e.next.label,
            defaultShortcut: e.next.keys,
            actionName: `${t}:next`,
            action: e.next.action,
          })),
          e &&
            e.previous &&
            (await o.setAddonShortcut(b, {
              label: e.previous.label,
              defaultShortcut: e.previous.keys,
              actionName: `${t}:previous`,
              action: e.previous.action,
            })),
          e &&
            e.reset &&
            (await o.setAddonShortcut(b, {
              label: e.reset.label,
              defaultShortcut: e.reset.keys,
              actionName: `${t}:reset`,
              action: e.reset.action,
            })));
      },
      z = (o) => (t) => {
        let {
            id: e,
            toolbar: { items: r, shortcuts: l },
          } = t,
          p = M(),
          [S, u] = A(),
          a = D([]),
          i = S[e],
          O = k(() => {
            u({ [e]: "" });
          }, [u]),
          v = k(() => {
            let s = a.current,
              c = s.indexOf(i),
              m = c === s.length - 1 ? 0 : c + 1,
              d = a.current[m];
            u({ [e]: d });
          }, [a, i, u]),
          C = k(() => {
            let s = a.current,
              c = s.indexOf(i),
              m = c > -1 ? c : 0,
              d = m === 0 ? s.length - 1 : m - 1,
              _ = a.current[d];
            u({ [e]: _ });
          }, [a, i, u]);
        return (
          x(() => {
            l &&
              q(p, e, {
                next: { ...l.next, action: v },
                previous: { ...l.previous, action: C },
                reset: { ...l.reset, action: O },
              });
          }, [p, e, l, v, C, O]),
          x(() => {
            a.current = $(r);
          }, []),
          n.createElement(o, { cycleValues: a.current, ...t })
        );
      },
      H = ({ currentValue: o, items: t }) =>
        o != null && t.find((e) => e.value === o && e.type !== "reset"),
      j = ({ currentValue: o, items: t }) => {
        let e = H({ currentValue: o, items: t });
        if (e) return e.icon;
      },
      Z = ({ currentValue: o, items: t }) => {
        let e = H({ currentValue: o, items: t });
        if (e) return e.title;
      },
      J = ({ active: o, disabled: t, title: e, icon: r, description: l, onClick: p }) =>
        n.createElement(
          N,
          { active: o, title: l, disabled: t, onClick: t ? () => {} : p },
          r && n.createElement(R, { icon: r, __suppressDeprecationWarning: !0 }),
          e ? `\xA0${e}` : null
        ),
      Q = ({
        right: o,
        title: t,
        value: e,
        icon: r,
        hideIcon: l,
        onClick: p,
        disabled: S,
        currentValue: u,
      }) => {
        let a =
            r &&
            n.createElement(R, {
              style: { opacity: 1 },
              icon: r,
              __suppressDeprecationWarning: !0,
            }),
          i = { id: e ?? "_reset", active: u === e, right: o, title: t, disabled: S, onClick: p };
        return (r && !l && (i.icon = a), i);
      },
      X = z(
        ({
          id: o,
          name: t,
          description: e,
          toolbar: { icon: r, items: l, title: p, preventDynamicIcon: S, dynamicTitle: u },
        }) => {
          let [a, i, O] = A(),
            [v, C] = L(!1),
            s = a[o],
            c = !!s,
            m = o in O,
            d = r,
            _ = p;
          (S || (d = j({ currentValue: s, items: l }) || d),
            u && (_ = Z({ currentValue: s, items: l }) || _),
            !_ && !d && console.warn(`Toolbar '${t}' has no title or icon`));
          let W = k(
            (E) => {
              i({ [o]: E });
            },
            [o, i]
          );
          return n.createElement(
            w,
            {
              placement: "top",
              tooltip: ({ onHide: E }) => {
                let F = l
                  .filter(({ type: I }) => {
                    let h = !0;
                    return (I === "reset" && !s && (h = !1), h);
                  })
                  .map((I) =>
                    Q({
                      ...I,
                      currentValue: s,
                      disabled: m,
                      onClick: () => {
                        (W(I.value), E());
                      },
                    })
                  );
                return n.createElement(V, { links: F });
              },
              closeOnOutsideClick: !0,
              onVisibleChange: C,
            },
            n.createElement(J, {
              active: v || c,
              disabled: m,
              description: e || "",
              icon: d,
              title: _ || "",
            })
          );
        }
      ),
      ee = () => {
        let o = P(),
          t = Object.keys(o).filter((e) => !!o[e].toolbar);
        return t.length
          ? n.createElement(
              n.Fragment,
              null,
              n.createElement(U, null),
              t.map((e) => {
                let r = K(e, o[e]);
                return n.createElement(X, { key: e, id: e, ...r });
              })
            )
          : null;
      };
    g.register(b, () =>
      g.add(b, {
        title: b,
        type: B.TOOL,
        match: ({ tabId: o }) => !o,
        render: () => n.createElement(ee, null),
      })
    );
  })();
} catch (e) {
  console.error("[Storybook] One of your manager-entries failed: " + import.meta.url, e);
}
