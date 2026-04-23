import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La ruta que buscas no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Vemo Focus Groups" },
      {
        name: "description",
        content: "Aplicación de pruebas para participantes y moderadores de Vemo.",
      },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Vemo Focus Groups" },
      {
        property: "og:description",
        content: "App de investigación con ejercicios guiados y dashboard moderador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Vemo Focus Groups" },
      { name: "description", content: "Vemo Focus Hub is a web application for conducting user testing sessions in focus groups." },
      { property: "og:description", content: "Vemo Focus Hub is a web application for conducting user testing sessions in focus groups." },
      { name: "twitter:description", content: "Vemo Focus Hub is a web application for conducting user testing sessions in focus groups." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3bf6384f-7b3e-43f2-bd59-2822aa5ce914/id-preview-8e55e838--5936c1f6-974c-4cbc-b0a7-0882c04ccd74.lovable.app-1776887524219.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3bf6384f-7b3e-43f2-bd59-2822aa5ce914/id-preview-8e55e838--5936c1f6-974c-4cbc-b0a7-0882c04ccd74.lovable.app-1776887524219.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
