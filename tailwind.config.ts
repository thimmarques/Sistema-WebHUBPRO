import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          muted: "hsl(var(--sidebar-muted))",
          active: "hsl(var(--sidebar-active))",
        },
        badge: {
          trabalhista: {
            DEFAULT: "hsl(var(--badge-trabalhista))",
            foreground: "hsl(var(--badge-trabalhista-fg))",
          },
          civil: {
            DEFAULT: "hsl(var(--badge-civil))",
            foreground: "hsl(var(--badge-civil-fg))",
          },
          criminal: {
            DEFAULT: "hsl(var(--badge-criminal))",
            foreground: "hsl(var(--badge-criminal-fg))",
          },
          previdenciario: {
            DEFAULT: "hsl(var(--badge-previdenciario))",
            foreground: "hsl(var(--badge-previdenciario-fg))",
          },
          ativo: {
            DEFAULT: "hsl(var(--badge-ativo))",
            foreground: "hsl(var(--badge-ativo-fg))",
          },
          audiencia: {
            DEFAULT: "hsl(var(--badge-audiencia))",
            foreground: "hsl(var(--badge-audiencia-fg))",
          },
          pendente: {
            DEFAULT: "hsl(var(--badge-pendente))",
            foreground: "hsl(var(--badge-pendente-fg))",
          },
          encerrado: {
            DEFAULT: "hsl(var(--badge-encerrado))",
            foreground: "hsl(var(--badge-encerrado-fg))",
          },
          recurso: {
            DEFAULT: "hsl(var(--badge-recurso))",
            foreground: "hsl(var(--badge-recurso-fg))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
