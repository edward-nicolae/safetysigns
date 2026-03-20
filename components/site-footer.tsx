export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-page py-6 text-center text-sm text-slate-600">
        © {new Date().getFullYear()} SafetySigns. All rights reserved.
      </div>
    </footer>
  );
}
