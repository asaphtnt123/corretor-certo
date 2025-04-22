exports.handler = async function() {
  return {
    statusCode: 200,
    body: JSON.stringify({
      key: process.env.STRIPE_PUBLIC_KEY || 'pk_live_51RGQ2oCaTJrTX5Tupk7zHAmRzxDgX9RtmxlFRwGNlyHudrhMjPVu0yx871bch1PpXkfUnOQN0UXB1mXzhwSMrDrG00ix8LTK9b'
    })
  };
};
