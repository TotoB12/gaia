document.addEventListener('DOMContentLoaded', async () => {
    const editor = document.getElementById('editor');
    const predictionary = Predictionary.instance();
  
    // Load the English word list
    try {
      const response = await fetch(chrome.runtime.getURL('data/words_en.txt'));
      const wordList = await response.text();
      
      // Parse the word list into Predictionary (matches demo's parsing)
      predictionary.parseWords(wordList, {
        elementSeparator: '\n',
        rankSeparator: ' ',
        wordPosition: 2,
        rankPosition: 0,
        addToDictionary: 'DICT_EN'
      });
  
      // Use only the English dictionary (matches demo's English-only option)
      predictionary.useDictionaries(['DICT_EN']);
    } catch (error) {
      console.error('Failed to load word list:', error);
    }
  
    let suggestionSpan = null;
  
    // Helper to remove the current suggestion
    function removeSuggestion() {
      if (suggestionSpan) {
        suggestionSpan.remove();
        suggestionSpan = null;
      }
    }
  
    // Get the full text content of the editor
    function getEditorText() {
      return editor.textContent;
    }
  
    // Get text before the cursor (limit to last 50 chars for performance)
    function getTextBeforeCursor() {
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return '';
      const range = selection.getRangeAt(0).cloneRange();
      range.setStart(editor, 0);
      let text = range.toString();
      return text.length > 50 ? text.slice(-50) : text;
    }
  
    // Get the current word being typed
    function getCurrentWord() {
      const textBefore = getTextBeforeCursor();
      const match = textBefore.match(/\w+$/);
      return match ? match[0] : '';
    }
  
    // Show inline suggestion at the cursor
    function showSuggestion() {
      removeSuggestion();
      const textBefore = getTextBeforeCursor();
      const suggestions = predictionary.predict(textBefore, { maxPredictions: 1 });
      if (suggestions.length > 0) {
        const currentWord = getCurrentWord();
        const suggestion = suggestions[0];
        if (suggestion.startsWith(currentWord)) {
          const completion = suggestion.slice(currentWord.length);
          if (completion) {
            const span = document.createElement('span');
            span.textContent = completion;
            span.className = 'suggestion';
            suggestionSpan = span;
  
            // Insert suggestion at cursor
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.collapse(false);
              range.insertNode(span);
              // Move cursor before the suggestion
              range.setStartBefore(span);
              range.setEndBefore(span);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }
      }
    }
  
    // Handle input events (learn from typing + show suggestion)
    editor.addEventListener('input', () => {
      // Learn from typing (matches demo's "learn from typing")
      predictionary.learnFromInput(getEditorText(), 'DICT_EN');
      showSuggestion();
    });
  
    // Handle Tab key to accept suggestion (learn from chosen)
    editor.addEventListener('keydown', (event) => {
      if (event.key === 'Tab' && suggestionSpan) {
        event.preventDefault();
        const completion = suggestionSpan.textContent;
  
        // Insert the completion text
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(completion));
          removeSuggestion();
  
          // Move cursor after the inserted text
          range.setStartAfter(range.endContainer);
          range.setEndAfter(range.endContainer);
          selection.removeAllRanges();
          selection.addRange(range);
  
          // Learn from chosen suggestion (matches demo's "learn from chosen")
          predictionary.applyPrediction(getEditorText(), completion, {
            addToDictionary: 'DICT_EN',
            shouldCompleteLastWord: true
          });
        }
      }
    });
  
    // Focus the editor on load
    editor.focus();
  });