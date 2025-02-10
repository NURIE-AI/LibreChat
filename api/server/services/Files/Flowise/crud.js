const fs = require('fs');
const axios = require('axios');
const getLogStores = require('~/cache/getLogStores');
const FormData = require('form-data');
const { CacheKeys } = require('librechat-data-provider');
const { logger } = require('~/config');

/**
 * Deletes a file from the filesystem. This function takes a file object, constructs the full path, and
 * verifies the path's validity before deleting the file. If the path is invalid, an error is thrown.
 *
 * @param {Express.Request} req - The request object from Express. It should have an `app.locals.paths` object with
 *                       a `publicPath` property.
 * @param {MongoFile} file - The file object to be deleted. It should have a `filepath` property that is
 *                           a string representing the path of the file relative to the publicPath.
 *
 * @returns {Promise<void>}
 *          A promise that resolves when the file has been successfully deleted, or throws an error if the
 *          file path is invalid or if there is an error in deletion.
 */
const deleteFileFromFlowise = async () => {
  // todo
};

/**
 * Uploads a file to the specified upload directory.
 *
 * @param {Object} params - The params object.
 * @param {ServerRequest} params.req - The request object from Express. It should have a `user` property with an `id`
 *                       representing the user, and an `app.locals.paths` object with an `uploads` path.
 * @param {Express.Multer.File} params.file - The file object, which is part of the request. The file object should
 *                                     have a `path` property that points to the location of the uploaded file.
 * @param {string} params.file_id - The file ID.
 *
 * @returns {Promise<{ filepath: string, bytes: number }>}
 *          A promise that resolves to an object containing:
 *            - filepath: The path where the file is saved.
 *            - bytes: The size of the file in bytes.
 */
async function uploadFileToFlowise({ req, file, file_id, convo_id, model }) {
  const baseURL = process.env.NURIEAI_HOST;
  const cache = getLogStores(CacheKeys.NURIEAI_MODEL_MAPPING);
  const orgination = req.user.orgination;
  const models = await cache.get(orgination);
  const modelId = models[model]?.id;
  const form = new FormData();
  const inputFilePath = file.path;
  const inputBuffer = await fs.promises.readFile(inputFilePath);
  const fileName = file_id + '__' + file.filename;
  const bytes = Buffer.byteLength(inputBuffer);
  form.append('chatId', convo_id);
  form.append('files', inputBuffer, fileName);

  await axios.post(`${baseURL}/api/v1/attachments/${modelId}/${convo_id}`, form, {
    headers: {
      ...form.getHeaders(),
      'x-request-from': 'internal',
    },
  });
  const downloadFilePath = `${baseURL}/api/v1/get-upload-file?chatflowId=${modelId}&chatId=${convo_id}&fileName=${fileName}`;
  return { filepath: downloadFilePath, bytes };
}

/**
 * Retrieves a readable stream for a file from local storage.
 *
 * @param {string} filepath - The filepath.
 * @returns {ReadableStream} A readable stream of the file.
 */
function getLocalFileStream(filepath) {
  try {
    return fs.createReadStream(filepath);
  } catch (error) {
    logger.error('Error getting local file stream:', error);
    throw error;
  }
}

module.exports = {
  deleteFileFromFlowise,
  uploadFileToFlowise,
};
