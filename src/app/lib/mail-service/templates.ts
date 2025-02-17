// TODO: Change this HTML to React components

export const userCredentialsTemplate = (
  userEmail: string,
  userPassword: string
): string => {
  return `
    <html>
    <head>
      <title>Here are your TaskMaster credentials</title>
    </head>
    <body>
      <p>
        Email: ${userEmail} <br/>
        Password: ${userPassword}
      </p>
    </body>
  </html>
    `;
};
