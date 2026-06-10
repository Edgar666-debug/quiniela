type RefreshingRouter = {
  push: (href: string) => void;
  refresh: () => void;
};

export function pushAndRefresh(router: RefreshingRouter, href: string) {
  router.push(href);
  router.refresh();
}
