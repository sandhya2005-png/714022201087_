import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  IconButton,
  Button,
} from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";
import LinkIcon from "@mui/icons-material/Link";
import { StoreProvider } from "./store";
import ShortenerPage from "./pages/ShortenerPage";
import StatsPage from "./pages/StatsPage";
import Redirector from "./pages/Redirector";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#006064" }, // teal-ish
    secondary: { main: "#00838f" },
  },
  shape: { borderRadius: 16 },
});

function Header() {
  const location = useLocation();
  return (
    <AppBar position="sticky" elevation={0} color="primary">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          AFFORDMED • URL Shortener
        </Typography>
        <Button
          component={Link}
          to="/"
          color={location.pathname === "/" ? "inherit" : "secondary"}
          startIcon={<LinkIcon />}
        >
          Shorten URLs
        </Button>
        <Button
          component={Link}
          to="/stats"
          color={location.pathname === "/stats" ? "inherit" : "secondary"}
          startIcon={<InsightsIcon />}
          sx={{ ml: 1 }}
        >
          Statistics
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <StoreProvider>
        <Header />
        <Container maxWidth="md">
          <Box sx={{ py: 3 }}>
            <Routes>
              <Route path="/" element={<ShortenerPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path=":code" element={<Redirector />} />
            </Routes>
          </Box>
        </Container>
      </StoreProvider>
    </ThemeProvider>
  );
}

