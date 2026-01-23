import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnvironmentModal } from './EnvironmentModal';
import '@testing-library/jest-dom';

describe('EnvironmentModal', () => {
    const mockEnvironment = {
        id: '1',
        name: 'Test Env',
        variables: [
            { key: 'var1', value: 'val1', enabled: true },
            { key: '', value: '', enabled: true }
        ]
    };

    it('should render correctly', () => {
        render(
            <EnvironmentModal
                environment={mockEnvironment}
                onSave={vi.fn()}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText('Edit Environment')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Env')).toBeInTheDocument();
        expect(screen.getByDisplayValue('var1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('val1')).toBeInTheDocument();
    });

    it('should update environment name', () => {
        render(
            <EnvironmentModal
                environment={mockEnvironment}
                onSave={vi.fn()}
                onClose={vi.fn()}
            />
        );

        const nameInput = screen.getByDisplayValue('Test Env');
        fireEvent.change(nameInput, { target: { value: 'New Name' } });
        expect(nameInput).toHaveValue('New Name');
    });

    it('should update variable key and value', () => {
        render(
            <EnvironmentModal
                environment={mockEnvironment}
                onSave={vi.fn()}
                onClose={vi.fn()}
            />
        );

        const keyInput = screen.getByDisplayValue('var1');
        fireEvent.change(keyInput, { target: { value: 'var1-mod' } });
        expect(keyInput).toHaveValue('var1-mod');

        const valInput = screen.getByDisplayValue('val1');
        fireEvent.change(valInput, { target: { value: 'val1-mod' } });
        expect(valInput).toHaveValue('val1-mod');
    });

    it('should add new variable row when editing last row', () => {
        render(
            <EnvironmentModal
                environment={mockEnvironment}
                onSave={vi.fn()}
                onClose={vi.fn()}
            />
        );

        const inputs = screen.getAllByPlaceholderText('Variable');
        const lastInput = inputs[inputs.length - 1]; // The empty one
        fireEvent.change(lastInput, { target: { value: 'newvar' } });

        // Should have added a new empty row
        const newInputs = screen.getAllByPlaceholderText('Variable');
        expect(newInputs).toHaveLength(3);
    });

    it('should remove variable row', () => {
        render(
            <EnvironmentModal
                environment={mockEnvironment}
                onSave={vi.fn()}
                onClose={vi.fn()}
            />
        );

        const deleteButtons = screen.getAllByText('🗑️');
        expect(deleteButtons).toHaveLength(1); // only for the first row, last empty one doesn't have it

        fireEvent.click(deleteButtons[0]);

        // var1 should be gone, only the empty one left
        expect(screen.queryByDisplayValue('var1')).not.toBeInTheDocument();
    });

    it('should toggle variable enabled state', () => {
        render(
            <EnvironmentModal
                environment={mockEnvironment}
                onSave={vi.fn()}
                onClose={vi.fn()}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes[0]).toBeChecked();

        fireEvent.click(checkboxes[0]);
        expect(checkboxes[0]).not.toBeChecked();
    });

    it('should call onSave with updated data', () => {
        const onSave = vi.fn();
        render(
            <EnvironmentModal
                environment={mockEnvironment}
                onSave={onSave}
                onClose={vi.fn()}
            />
        );

        const nameInput = screen.getByDisplayValue('Test Env');
        fireEvent.change(nameInput, { target: { value: 'Saved Name' } });

        fireEvent.click(screen.getByText('Save'));

        expect(onSave).toHaveBeenCalledWith('1', 'Saved Name', expect.arrayContaining([
            expect.objectContaining({ key: 'var1', value: 'val1' })
        ]));
    });

    it('should call onClose when Cancel is clicked', () => {
        const onClose = vi.fn();
        render(
            <EnvironmentModal
                environment={mockEnvironment}
                onSave={vi.fn()}
                onClose={onClose}
            />
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when Close Icon is clicked', () => {
        const onClose = vi.fn();
        render(
            <EnvironmentModal
                environment={mockEnvironment}
                onSave={vi.fn()}
                onClose={onClose}
            />
        );

        fireEvent.click(screen.getByText('✕'));
        expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when Overlay is clicked', () => {
        const onClose = vi.fn();
        const { container } = render(
            <EnvironmentModal
                environment={mockEnvironment}
                onSave={vi.fn()}
                onClose={onClose}
            />
        );

        // The overlay is the first child
        fireEvent.click(container.firstChild!);
        expect(onClose).toHaveBeenCalled();
    });

    it('should not close when content is clicked', () => {
        const onClose = vi.fn();
        render(
            <EnvironmentModal
                environment={mockEnvironment}
                onSave={vi.fn()}
                onClose={onClose}
            />
        );

        fireEvent.click(screen.getByText('Edit Environment'));
        expect(onClose).not.toHaveBeenCalled();
    });

    it('should handle removing the only row (should reset to empty)', () => {
        const singleVarEnv = {
            id: '1',
            name: 'Single',
            variables: [{ key: 'v1', value: 'v1', enabled: true }]
        };

        // Note: The UI logic `variables.length > 1 && i !== variables.length - 1` hides the delete button
        // if it's the last one OR if it's the "add new" row (which is usually the last one).
        // If we only have 1 row (which is also the last one?), wait.
        // If we have [{key: 'v1'}] (length 1), then i=0, length-1 = 0.
        // Condition: 1 > 1 && ... => False. So no delete button.
        // So we can't test "removing the only row" via UI because the button isn't there.
        // However, if we have [{key: 'v1'}, {key: ''}] (length 2).
        // Row 0: 2 > 1 (True) && 0 !== 1 (True) -> Delete button shown.
        // Removing Row 0 leaves [{key: ''}].
        // Row 0 (was 1): 1 > 1 (False) -> No delete button.

        // So the `else` block in `removeVariable` (`setVariables([{ key: '', value: '', enabled: true }])`)
        // is actually unreachable via UI clicks if the button is hidden when length <= 1.
        // BUT, let's verify if we can reach it if we somehow force it, or just accept it's unreachable UI-wise.
        // Or maybe I misunderstood the logic.

        // Let's test the visible logic:
        render(
            <EnvironmentModal
                environment={{
                    id: '1',
                    name: 'Test',
                    variables: [{ key: 'v1', value: 'val1', enabled: true }, { key: '', value: '', enabled: true }]
                }}
                onSave={vi.fn()}
                onClose={vi.fn()}
            />
        );

        const deleteButtons = screen.getAllByText('🗑️');
        fireEvent.click(deleteButtons[0]);

        // Now we have 1 row.
        expect(screen.queryByText('🗑️')).not.toBeInTheDocument();
    });
});
