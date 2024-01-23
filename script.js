document.addEventListener("DOMContentLoaded", function () {
  initializeApp();

  async function initializeApp() {
    try {
      const { canvas, ctx } = await initializeCanvas('canvas-container', 750, 1050);
      setupEventHandlers(canvas, ctx);
    } catch (error) {
      console.error('Initialization failed:', error);
    }
  }

  function initializeCanvas(containerId, width, height) {
    return new Promise((resolve, reject) => {
      const container = document.getElementById(containerId);
      if (!container) {
        reject(new Error('Container element not found'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      container.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      resolve({ canvas, ctx });
    });
  }

  function setupEventHandlers(canvas, ctx) {
    let img = new Image();
    let offset = { y: 0 };

    const drawImageHandler = createDrawImageHandler(ctx, img, canvas, offset);
    const updateImagePositionHandler = createUpdateImagePositionHandler(canvas, ctx, img, offset, drawImageHandler);

    const imageInput = document.getElementById("image-input");
    imageInput.addEventListener("change", function (e) {
      handleImageUpload(e, img, drawImageHandler);
    });

    ['click', 'touchend'].forEach((eventType) => {
      canvas.addEventListener(eventType, function (e) {
        updateImagePositionHandler(e);
      });
    });

    const downloadButton = document.getElementById("download-button");
    downloadButton.addEventListener("click", function () {
      handleDownload(canvas, drawImageHandler);
    });
  }

  function handleImageUpload(event, img, drawImageHandler) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        img.src = e.target.result;
        img.onload = function() {
          drawImageHandler();
        };
      };
      reader.readAsDataURL(file);
    }
  }

  function handleDownload(canvas, drawImageHandler) {
    drawImageHandler();
    canvas.toBlob(function(blob) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const uuid = uuidv4();
      link.download = `business_card_${uuid}.png`;
      setTimeout(function() {
        link.click();
        URL.revokeObjectURL(link.href);
      }, 100);
    }, 'image/png');
  }

  function createDrawImageHandler(ctx, img, canvas, offset) {
    return function () {
      clearAndDrawImage(ctx, img, canvas, offset);
    };
  }

  function createUpdateImagePositionHandler(canvas, ctx, img, offset, drawImageHandler) {
    return function (event) {
      const rect = canvas.getBoundingClientRect();
      const y = ('clientY' in event) ? event.clientY : event.changedTouches[0].clientY;
      const delta = y - rect.top - canvas.height / 2;

      offset.y += delta;
      offset.y = Math.min(0, Math.max(canvas.height - img.height, offset.y));

      clearAndDrawImage(ctx, img, canvas, offset);
      drawImageHandler();
    };
  }

  function clearAndDrawImage(ctx, img, canvas, offset) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const imgAspectRatio = img.width / img.height;
    const canvasAspectRatio = canvas.width / canvas.height;
    if (imgAspectRatio > canvasAspectRatio) {
      img.height = canvas.height;
      img.width = canvas.height * imgAspectRatio;
    } else {
      img.width = canvas.width;
      img.height = canvas.width / imgAspectRatio;
    }
    ctx.drawImage(img, (canvas.width - img.width) / 2, offset.y, img.width, img.height);
  }
});