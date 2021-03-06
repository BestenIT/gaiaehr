<?php
/**
 * Created by JetBrains PhpStorm.
 * User: erodriguez
 * Date: 4/14/12
 * Time: 12:24 PM
 * To change this template use File | Settings | File Templates.
 */
if(!isset($_SESSION)) {
	session_name('GaiaEHR');
	session_start();
	session_cache_limiter('private');
}
$_SESSION['site']['flops'] = 0;
class FileManager
{
	public $workingDir;
	public $workingDirName;
	public $tempDir;
	public $fileName;
	public $fileExtension;
	public $error = '';
	public  $src;

	function __construct()
	{
		$this->db = new dbHelper();
		$this->tempDir = $_SESSION['site']['root'] . '/temp/';
		chmod($this->tempDir, 0777);
		return;
	}

	public function cleanUp()
	{
		if(is_dir($this->workingDir)){
			$this->deleteWorkingDir();
		}
	}

	public function moveUploadedFileToTempDir($file)
	{
		$this->setFileExtensionFromFile($file['filePath']['name']);
		$this->setSrc();
		if(move_uploaded_file($file['filePath']['tmp_name'], $this->src)) {
			return true;
		} else {
			$this->error = 'Unable to move uploaded file to /temp directory';
			return false;
		}
	}

	public function moveUploadedFileToDir($file, $dir)
	{
		if(move_uploaded_file($file['filePath']['tmp_name'], $dir.$this->setFileExtensionFromFile($file['filePath']['name']))) {
			return true;
		} else {
			return false;
		}
	}

	public function extractUploadedFileToTempDir($file)
	{
		$this->setSrc();
		if($this->extractFileToTempDir($file['filePath']['tmp_name'])) {
			return true;
		} else {
			$this->error = 'Unable to extract zipped file to /temp directory';
			return false;
		}
	}

	public function extractFileToTempDir($file, $deleteSrcFile = false)
	{
		if($this->setWorkingDir()){
			return $this->extractFileToDir($file, $this->workingDir, $deleteSrcFile);
		}else{
			$this->error = 'Unable to create working directory';
			return false;
		}
	}

	public function extractFileToDir($file, $toDir, $deleteSrcFile = false)
	{
		if(class_exists('ZipArchive')){
			$zip = new ZipArchive();
			if ($zip->open($file) === true) {
				$zip->extractTo($toDir);
				$zip->close();
				if($deleteSrcFile){
					$this->deleteFileBySrc($file);
				}
				return $this->workingDir;
			}else{
				$this->error = 'Unable to open zipped file';
				return false;
			}
		}else{
			$this->error = 'Php class ZipArchive required';
			return false;
		}
	}

	public function setWorkingDir()
	{
		$workingDir = $_SESSION['site']['root'] . '/temp/'. $this->getTempDirAvailableName();
		if(!is_dir($workingDir)){
			if(mkdir($workingDir, 0777, true)){
				chmod($workingDir, 0777);
				$this->workingDir = $workingDir;
				return true;
			}else{
				$this->error = 'Unable to write on /temp directory';
				return false;
			}
		}else{
			$this->error = $workingDir .' exist';
			return false;
		}
	}

	public function chmodReclusive($dir, $mode)
	{
		if(!is_dir($dir)) {
			return chmod($dir, $mode);
		}
		$dh = opendir($dir);
		while($file = readdir($dh)) {
			if($file != '.' && $file != '..') {
				$fullPath = $dir . '/' . $file;
				if(!is_dir($fullPath)) {
					if(!chmod($fullPath, $mode)) {
						return true;
					}
				} else {
					if(!$this->chmodReclusive($fullPath, $mode)) {
						return false;
					}
				}
			}
		}
		closedir($dh);
		if(chmod($dir, $mode)) {
			return true;
		} else {
			return false;
		}
	}

	private function getTempDirAvailableName()
	{
		$name = time();
		while(file_exists($this->tempDir . $name)) {
			$name = time();
		}
		$this->workingDirName = $name;
		return $this->workingDirName;
	}

	public function getWorkingDirName()
	{
		return $this->workingDirName;
	}

	private function setFileExtensionFromFile($fileName)
	{
		$foo = explode('.',$fileName);
		return $this->fileExtension = '.'.end($foo);
	}

	private function setSrc()
	{
		$this->src = $this->tempDir . $this->fileName . $this->fileExtension;
		return;
	}

	private function deleteWorkingDir()
	{
		return $this->rmdir_recursive($this->workingDir);
	}

	public function deleteFileBySrc($src)
	{
		return $this->rmdir_recursive($src);
	}

	public function scanDir($dir){
		$files = scandir($dir);
		array_shift($files); // get rid of '.'
		array_shift($files); // get rid of '..'
		return $files;
	}

	public function rmdir_recursive($dir) {
	    $files = scandir($dir);
	    array_shift($files);    // remove '.' from array
	    array_shift($files);    // remove '..' from array
	    foreach ($files as $file) {
	        $file = $dir . '/' . $file;
	        if (is_dir($file)) {
	            $this->rmdir_recursive($file);
		    continue;
	        }
	        unlink($file);
	    }
	    rmdir($dir);
		return true;
	}
}





