import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import Sidebar from './components/Sidebar';
import RequestEditor from './components/RequestEditor';
import ResponseViewer from './components/ResponseViewer';

const GlobalStyle = createGlobalStyle`
  :root {
    font-family: 'Segoe UI', Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    font-weight: 400;

    color-scheme: dark;
    color: #e0e0e0;
    background-color: #1e1e1e;

    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    margin: 0;
    display: flex;
    min-width: 800px;
    min-height: 100vh;
    background-color: #1e1e1e;
    color: #cccccc;
    overflow: hidden;
  }

  #root {
    width: 100%;
    height: 100vh;
  }
`;

const AppContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #1e1e1e;
`;

function App() {
  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Sidebar />
        <MainContent>
            <RequestEditor />
            <ResponseViewer />
        </MainContent>
      </AppContainer>
    </>
  );
}

export default App;
