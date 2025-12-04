// Spiced Color Palette
export const colors = {
  navy: '#17222B',
  burgundy: '#86373E',
  brown: '#44332D',
  peach: '#F1BD78',
  cream: '#EFD9C7',
  ivory: '#FBF8F0',
};

// Navigation styles
export const navStyles = {
  nav: {
    backgroundColor: colors.navy,
    color: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  brand: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: colors.peach,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    position: 'relative',
  },
  username: {
    fontSize: '0.875rem',
    color: colors.peach,
  },
  userButton: {
    backgroundColor: 'transparent',
    border: `1px solid ${colors.brown}`,
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    transition: 'background-color 0.2s',
  },
  userButtonHover: {
    backgroundColor: colors.brown,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '0.5rem',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    minWidth: '200px',
    zIndex: 50,
  },
  dropdownItem: {
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    color: '#1f2937',
    fontSize: '0.875rem',
    transition: 'background-color 0.2s',
    display: 'block',
    width: '100%',
    border: 'none',
    textAlign: 'left',
    backgroundColor: 'transparent',
  },
  dropdownItemHover: {
    backgroundColor: '#f3f4f6',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '0.25rem 0',
  },
  signOutButton: {
    backgroundColor: colors.burgundy,
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
};

// Dashboard styles
export const dashboardStyles = {
  container: {
    padding: "2rem",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "1rem",
  },
  section: {
    marginBottom: "3rem",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "0.5rem",
    padding: "1.5rem",
    backgroundColor: "#ffffff",
  },
  cardSecondary: {
    border: "1px solid #e5e7eb",
    borderRadius: "0.5rem",
    padding: "1.5rem",
    backgroundColor: "#f9fafb",
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "0.5rem",
  },
  cardText: {
    color: colors.brown,
    fontSize: "0.875rem",
    marginBottom: "1rem",
  },
  button: {
    backgroundColor: colors.burgundy,
    color: "white",
    padding: "0.5rem 1rem",
    borderRadius: "0.375rem",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  buttonApplied: {
    backgroundColor: colors.peach,
    color: colors.navy,
    padding: "0.5rem 1rem",
    borderRadius: "0.375rem",
    border: "none",
    cursor: "default",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  buttonUnapplied: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
    padding: "0.5rem 1rem",
    borderRadius: "0.375rem",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  gridContainer: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  },
  flexColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  flexRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  emptyState: {
    color: colors.brown,
    fontStyle: "italic",
  },
  feedbackContent: {
    marginBottom: "1rem",
    lineHeight: "1.6",
  },
  metaText: {
    color: colors.brown,
    fontSize: "0.875rem",
    marginTop: "0.5rem",
  },
};
