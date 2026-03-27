export function textResponse(text) {
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

