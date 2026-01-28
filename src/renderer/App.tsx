import React, { useState, useRef, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import Sidebar from './components/Sidebar';
import RequestEditor from './components/RequestEditor';
import ResponseViewer from './components/ResponseViewer';
import TabList from './components/TabList';
import { ResizeHandle } from './components/ResizeHandle';

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
  min-width: 0; /* Prevent flex overflow */
`;

const SidebarWrapper = styled.div<{ width: number }>`
  width: ${props => props.width}px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
`;

const EditorWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

const ResponseWrapper = styled.div<{ height: number }>`
  height: ${props => props.height}px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 50px;
`;

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [responseHeight, setResponseHeight] = useState(300);
  const isResizing = useRef(false);
  const sidebarWidthRef = useRef(sidebarWidth);
  const responseHeightRef = useRef(responseHeight);

  // Load saved layout
  useEffect(() => {
      const savedWidth = localStorage.getItem('sidebarWidth');
      if (savedWidth) setSidebarWidth(parseInt(savedWidth));
      const savedHeight = localStorage.getItem('responseHeight');
      if (savedHeight) setResponseHeight(parseInt(savedHeight));
  }, []);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    responseHeightRef.current = responseHeight;
  }, [responseHeight]);

  const startResizeSidebar = (e: React.MouseEvent) => {
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(600, startWidth + (moveEvent.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizing.current = false;
      localStorage.setItem('sidebarWidth', sidebarWidthRef.current.toString());
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const startResizeResponse = (e: React.MouseEvent) => {
    isResizing.current = true;
    const startY = e.clientY;
    const startHeight = responseHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Dragging down decreases height (since it's at bottom)? No, handle is top of response.
      // Dragging down -> y increases -> height decreases.
      // Dragging up -> y decreases -> height increases.
      const diff = startY - moveEvent.clientY;
      const newHeight = Math.max(100, Math.min(800, startHeight + diff));
      setResponseHeight(newHeight);
    };

    const onMouseUp = () => {
      isResizing.current = false;
      localStorage.setItem('responseHeight', responseHeightRef.current.toString());
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Persist layout when changed (debounced via effect could work, but simple effect is fine)
  useEffect(() => {
      if (!isResizing.current) {
          localStorage.setItem('sidebarWidth', sidebarWidth.toString());
      }
  }, [sidebarWidth]);

  useEffect(() => {
      if (!isResizing.current) {
          localStorage.setItem('responseHeight', responseHeight.toString());
      }
  }, [responseHeight]);


  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <SidebarWrapper width={sidebarWidth}>
             <Sidebar />
        </SidebarWrapper>

        <ResizeHandle direction="horizontal" onMouseDown={startResizeSidebar} />

        <MainContent>
            <TabList />
            <EditorWrapper>
                <RequestEditor />
            </EditorWrapper>

            <ResizeHandle direction="vertical" onMouseDown={startResizeResponse} />

            <ResponseWrapper height={responseHeight}>
                <ResponseViewer />
            </ResponseWrapper>
        </MainContent>
      </AppContainer>
    </>
  );
}

export default App;
