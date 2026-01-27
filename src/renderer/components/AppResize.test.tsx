import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import App from '../App';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock child components to simplify testing
vi.mock('../components/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>
}));

vi.mock('../components/RequestEditor', () => ({
  default: () => <div data-testid="request-editor">Request Editor</div>
}));

vi.mock('../components/ResponseViewer', () => ({
  default: () => <div data-testid="response-viewer">Response Viewer</div>
}));

vi.mock('../components/TabList', () => ({
  default: () => <div data-testid="tab-list">Tab List</div>
}));

describe('App Resize', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

  it('should resize sidebar', () => {
    render(<App />);

    // Find the horizontal resize handle (first one usually)
    // Looking at App.tsx, there are two ResizeHandles.
    // <ResizeHandle direction="horizontal" ... /> is the first one.
    // We can't easily query by props, but we can query by class or assume order if we don't mock ResizeHandle.
    // Or we can verify the DOM structure.

    // Let's assume we didn't mock ResizeHandle, so it renders a div.
    // We can find it by looking for the handle.
    // Since ResizeHandle is a styled component, we might need a way to identify it.
    // Maybe we should add data-testid to App.tsx if possible?
    // But we are not supposed to edit source unless necessary.
    // ResizeHandle renders a div.

    // Let's try to find it by style or order.
    // The rendered output will have:
    // SidebarWrapper, ResizeHandle (horizontal), MainContent...

    // Actually, ResizeHandle has specific styles.
    // But easier: rely on layout.

    const handles = document.querySelectorAll('div');
    // This is too generic.

    // Let's look at App.tsx again.
    // <ResizeHandle direction="horizontal" onMouseDown={startResizeSidebar} />

    // Since ResizeHandle is imported, maybe we should mock it too to capture props?
    // But we want to test interaction.

    // Let's rely on `fireEvent` on the handle.
    // We can find the handle by getting the sidebar and taking the next sibling?
    const sidebar = screen.getByTestId('sidebar').parentElement; // SidebarWrapper
    const resizeHandle = sidebar?.nextElementSibling;

    if (!resizeHandle) throw new Error('Resize handle not found');

    fireEvent.mouseDown(resizeHandle, { clientX: 300 });

    // Move mouse on window
    fireEvent.mouseMove(window, { clientX: 400 });
    fireEvent.mouseUp(window);

    // Verify width changed.
    // SidebarWrapper width is passed as prop.
    expect(sidebar).toHaveStyle({ width: '400px' });
  });

  it('should resize response viewer', () => {
      render(<App />);

      const responseViewer = screen.getByTestId('response-viewer').parentElement; // ResponseWrapper
      // Response handle is previous sibling of ResponseWrapper in MainContent?
      // MainContent > TabList, EditorWrapper, ResizeHandle (vertical), ResponseWrapper

      const resizeHandle = responseViewer?.previousElementSibling;
      if (!resizeHandle) throw new Error('Response resize handle not found');

      // Default height is 300.
      fireEvent.mouseDown(resizeHandle, { clientY: 500 }); // startY

      // Drag up (decrease Y) -> increase height?
      // App.tsx: startHeight + (startY - clientY)
      // 300 + (500 - 400) = 400

      fireEvent.mouseMove(window, { clientY: 400 });
      fireEvent.mouseUp(window);

      expect(responseViewer).toHaveStyle({ height: '400px' });
  });

  it('should constrain sidebar resizing', () => {
      render(<App />);
      const sidebar = screen.getByTestId('sidebar').parentElement;
      const resizeHandle = sidebar?.nextElementSibling!;

      fireEvent.mouseDown(resizeHandle, { clientX: 300 });

      // Try to make it very small (< 200)
      fireEvent.mouseMove(window, { clientX: 0 });
      // 300 + (0 - 300) = 0 -> clamped to 200

      fireEvent.mouseUp(window);
      expect(sidebar).toHaveStyle({ width: '200px' });

      // Try to make it very large (> 600)
      fireEvent.mouseDown(resizeHandle, { clientX: 200 });
      fireEvent.mouseMove(window, { clientX: 1000 });
      fireEvent.mouseUp(window);
      expect(sidebar).toHaveStyle({ width: '600px' });
  });

   it('should constrain response viewer resizing', () => {
      render(<App />);
      const responseViewer = screen.getByTestId('response-viewer').parentElement;
      const resizeHandle = responseViewer?.previousElementSibling!;

      fireEvent.mouseDown(resizeHandle, { clientY: 500 });

      // Try to make it very small (< 100)
      // startHeight + (startY - moveY)
      // 300 + (500 - 800) = 0 -> clamped to 100
       fireEvent.mouseMove(window, { clientY: 800 });
       fireEvent.mouseUp(window);
       expect(responseViewer).toHaveStyle({ height: '100px' });

       // Try to make it very large (> 800)
       // 100 + (800 - 0) = 900 -> clamped to 800
       fireEvent.mouseDown(resizeHandle, { clientY: 800 });
       fireEvent.mouseMove(window, { clientY: 0 });
       fireEvent.mouseUp(window);
       expect(responseViewer).toHaveStyle({ height: '800px' });
  });

  it('should load saved layout from localStorage', () => {
      localStorage.setItem('sidebarWidth', '450');
      localStorage.setItem('responseHeight', '350');

      render(<App />);

      const sidebar = screen.getByTestId('sidebar').parentElement;
      expect(sidebar).toHaveStyle({ width: '450px' });

      const responseViewer = screen.getByTestId('response-viewer').parentElement;
      expect(responseViewer).toHaveStyle({ height: '350px' });
  });

  it('should not update state if mousemove happens without mousedown', () => {
      render(<App />);
      const sidebar = screen.getByTestId('sidebar').parentElement;

      fireEvent.mouseMove(window, { clientX: 500 });
      expect(sidebar).toHaveStyle({ width: '300px' }); // Default
  });
});
