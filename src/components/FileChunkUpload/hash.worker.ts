import SparkMD5 from 'spark-md5';

/**
 * 计算大文件 Hash 的 Web Worker
 */
self.onmessage = async (e) => {
    const { file, chunkSize = 1024 * 1024 * 5 } = e.data;
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    const totalChunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;

    const loadNext = () => {
        const start = currentChunk * chunkSize;
        const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
        reader.readAsArrayBuffer(file.slice(start, end));
    };

    reader.onload = (event) => {
        if (!event.target?.result) {
            self.postMessage({ type: 'error', error: '文件内容读取为空' });
            return;
        }
        spark.append(event.target.result as ArrayBuffer);
        currentChunk++;

        if (currentChunk < totalChunks) {
            self.postMessage({
                type: 'progress',
                progress: Math.floor((currentChunk / totalChunks) * 100),
            });
            loadNext();
        } else {
            self.postMessage({
                type: 'success',
                hash: spark.end(),
            });
        }
    };

    reader.onerror = (err) => {
        console.error('Worker FileReader Error:', err);
        self.postMessage({ type: 'error', error: '文件读取运行出错' });
    };

    loadNext();
};
