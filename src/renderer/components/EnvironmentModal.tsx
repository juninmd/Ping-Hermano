import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Environment, Variable } from '../stores/RequestStore';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: var(--surface);
  width: 600px;
  height: 500px;
  border: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
`;

const ModalHeader = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid var(--line);
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--fg);
`;

const ModalBody = styled.div`
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ModalFooter = styled.div`
  padding: 10px 15px;
  border-top: 1px solid var(--line);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const Input = styled.input`
  padding: 8px;
  background-color: var(--input);
  color: var(--fg);
  border: 1px solid var(--line);
  outline: none;
  width: 100%;

  &:focus {
    border-color: var(--accent);
  }
`;

const VariableRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Checkbox = styled.input`
  cursor: pointer;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: var(--mute);
  cursor: pointer;
  font-size: 16px;

  &:hover {
    color: var(--err);
  }
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  background-color: ${props => props.$primary ? 'var(--accent)' : 'var(--input)'};
  color: ${props => props.$primary ? 'white' : 'var(--fg)'};
  border: 1px solid ${props => props.$primary ? 'var(--accent)' : 'var(--line)'};
  cursor: pointer;

  &:hover {
    background-color: ${props => props.$primary ? 'var(--accent-h)' : 'var(--line2)'};
  }
`;

interface Props {
  environment: Environment;
  onSave: (id: string, name: string, variables: Variable[]) => void;
  onClose: () => void;
}

export const EnvironmentModal: React.FC<Props> = ({ environment, onSave, onClose }) => {
  const [name, setName] = useState(environment.name);
  const [variables, setVariables] = useState<Variable[]>([]);

  useEffect(() => {
    // Deep copy variables
    setVariables(environment.variables.map(v => ({ ...v })));
  }, [environment]);

  const handleVariableChange = (index: number, field: keyof Variable, value: any) => {
    const newVars = [...variables];
    (newVars[index] as any)[field] = value;

    if (index === newVars.length - 1 && (newVars[index].key || newVars[index].value)) {
      newVars.push({ key: '', value: '', enabled: true });
    }

    setVariables(newVars);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <span>Edit Environment</span>
          <IconButton onClick={onClose}>✕</IconButton>
        </ModalHeader>
        <ModalBody>
          <div>
            <label style={{ display: 'block', marginBottom: 5, color: 'var(--mute)' }}>Environment Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 5, color: 'var(--mute)' }}>Variables</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {variables.map((v, i) => (
                    <VariableRow key={i}>
                        <Checkbox
                            type="checkbox"
                            checked={v.enabled}
                            onChange={e => handleVariableChange(i, 'enabled', e.target.checked)}
                        />
                        <Input
                            placeholder="Variable"
                            value={v.key}
                            onChange={e => handleVariableChange(i, 'key', e.target.value)}
                        />
                        <Input
                            placeholder="Value"
                            value={v.value}
                            onChange={e => handleVariableChange(i, 'value', e.target.value)}
                        />
                        {variables.length > 1 && i !== variables.length - 1 && (
                            <IconButton onClick={() => removeVariable(i)}>🗑️</IconButton>
                        )}
                    </VariableRow>
                ))}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button $primary onClick={() => onSave(environment.id, name, variables)}>Save</Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};
