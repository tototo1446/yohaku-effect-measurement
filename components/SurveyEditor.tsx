import React, { useState } from 'react';
import { Survey, Question, QuestionOption, QuestionType } from '../types';

interface SurveyEditorProps {
  survey: Survey;
  onSave: (survey: Survey) => void;
  onCancel: () => void;
}

const SurveyEditor: React.FC<SurveyEditorProps> = ({ survey, onSave, onCancel }) => {
  // デフォルトの「名前」質問を生成
  const getDefaultNameQuestion = (): Question => ({
    id: 'q-name-default',
    title: '名前',
    type: 'text',
    required: true,
    placeholder: 'お名前を入力してください',
  });

  // 初期化時に「名前」質問が存在しない場合は最初に追加
  const initializeSurvey = (survey: Survey): Survey => {
    const hasNameQuestion = survey.questions.some(q => q.id === 'q-name-default');
    if (!hasNameQuestion) {
      // 「名前」質問が存在しない場合は最初に追加
      return {
        ...survey,
        questions: [getDefaultNameQuestion(), ...survey.questions],
      };
    } else {
      // 「名前」質問が存在するが、最初にない場合は最初に移動
      const nameQuestionIndex = survey.questions.findIndex(q => q.id === 'q-name-default');
      if (nameQuestionIndex > 0) {
        const questions = [...survey.questions];
        const nameQuestion = questions.splice(nameQuestionIndex, 1)[0];
        return {
          ...survey,
          questions: [nameQuestion, ...questions],
        };
      }
    }
    return survey;
  };

  const [editedSurvey, setEditedSurvey] = useState<Survey>(initializeSurvey(survey));
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [questionFormData, setQuestionFormData] = useState<Partial<Question>>({
    title: '',
    type: 'radio',
    required: false,
    options: [],
    placeholder: '',
    maxLength: undefined,
    rankDescriptions: {},
  });

  const handleUpdateSurvey = (updates: Partial<Survey>) => {
    setEditedSurvey({ ...editedSurvey, ...updates, updatedAt: new Date().toISOString() });
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      title: '無題の質問',
      type: 'radio',
      required: false,
      options: [
        { id: `opt-${Date.now()}-1`, label: '選択肢1', value: 'option1' },
        { id: `opt-${Date.now()}-2`, label: '選択肢2', value: 'option2' },
      ],
    };
    const updatedQuestions = [...editedSurvey.questions, newQuestion];
    handleUpdateSurvey({ questions: updatedQuestions });
    setSelectedQuestionIndex(updatedQuestions.length - 1);
    setIsEditingQuestion(true);
    setQuestionFormData({ ...newQuestion });
  };

  const handleSelectQuestion = (index: number) => {
    setSelectedQuestionIndex(index);
    setIsEditingQuestion(true);
    const question = editedSurvey.questions[index];
    setQuestionFormData({
      title: question.title,
      type: question.type,
      required: question.required,
      options: question.options ? [...question.options] : [],
      placeholder: question.placeholder || '',
      maxLength: question.maxLength,
      rankDescriptions: question.rankDescriptions ? { ...question.rankDescriptions } : {},
    });
  };

  const handleSaveQuestion = () => {
    if (!questionFormData.title?.trim()) {
      alert('質問タイトルを入力してください。');
      return;
    }

    if (selectedQuestionIndex === null) return;

    const updatedQuestion: Question = {
      id: editedSurvey.questions[selectedQuestionIndex].id,
      title: questionFormData.title!,
      type: questionFormData.type || 'radio',
      required: questionFormData.required ?? false,
      options: questionFormData.options || [],
      placeholder: questionFormData.placeholder,
      maxLength: questionFormData.maxLength,
      rankDescriptions: questionFormData.rankDescriptions,
    };

    const updatedQuestions = [...editedSurvey.questions];
    updatedQuestions[selectedQuestionIndex] = updatedQuestion;
    handleUpdateSurvey({ questions: updatedQuestions });
    setIsEditingQuestion(false);
  };

  const handleDeleteQuestion = (index: number) => {
    if (confirm('この質問を削除してもよろしいですか？')) {
      const updatedQuestions = editedSurvey.questions.filter((_, i) => i !== index);
      handleUpdateSurvey({ questions: updatedQuestions });
      if (selectedQuestionIndex === index) {
        setSelectedQuestionIndex(null);
        setIsEditingQuestion(false);
      } else if (selectedQuestionIndex !== null && selectedQuestionIndex > index) {
        setSelectedQuestionIndex(selectedQuestionIndex - 1);
      }
    }
  };

  const handleDuplicateQuestion = (index: number) => {
    const question = editedSurvey.questions[index];
    const duplicatedQuestion: Question = {
      ...question,
      id: `q-${Date.now()}`,
      title: `${question.title} (コピー)`,
      options: question.options?.map(opt => ({
        ...opt,
        id: `opt-${Date.now()}-${Math.random()}`,
      })),
    };
    const updatedQuestions = [...editedSurvey.questions];
    updatedQuestions.splice(index + 1, 0, duplicatedQuestion);
    handleUpdateSurvey({ questions: updatedQuestions });
  };

  const handleReorderQuestion = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const updatedQuestions = [...editedSurvey.questions];
    const [moved] = updatedQuestions.splice(fromIndex, 1);
    updatedQuestions.splice(toIndex, 0, moved);
    handleUpdateSurvey({ questions: updatedQuestions });
    setSelectedQuestionIndex(toIndex);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= editedSurvey.questions.length) return;

    const updatedQuestions = [...editedSurvey.questions];
    [updatedQuestions[index], updatedQuestions[newIndex]] = [updatedQuestions[newIndex], updatedQuestions[index]];
    handleUpdateSurvey({ questions: updatedQuestions });
    setSelectedQuestionIndex(newIndex);
  };

  const handleAddOption = () => {
    const newOption: QuestionOption = {
      id: `opt-${Date.now()}`,
      label: '',
      value: '',
    };
    setQuestionFormData({
      ...questionFormData,
      options: [...(questionFormData.options || []), newOption],
    });
  };

  const handleUpdateOption = (index: number, field: 'label' | 'value', value: string) => {
    const options = [...(questionFormData.options || [])];
    options[index] = { ...options[index], [field]: value };
    setQuestionFormData({ ...questionFormData, options });
  };

  const handleDeleteOption = (index: number) => {
    const options = questionFormData.options?.filter((_, idx) => idx !== index) || [];
    setQuestionFormData({ ...questionFormData, options });
  };

  const handleUpdateRankDescription = (rank: string, index: number, value: string) => {
    const rankDescriptions = { ...(questionFormData.rankDescriptions || {}) };
    if (!rankDescriptions[rank]) {
      rankDescriptions[rank] = [];
    }
    rankDescriptions[rank][index] = value;
    setQuestionFormData({ ...questionFormData, rankDescriptions });
  };

  const handleAddRankDescription = (rank: string) => {
    const rankDescriptions = { ...(questionFormData.rankDescriptions || {}) };
    if (!rankDescriptions[rank]) {
      rankDescriptions[rank] = [];
    }
    rankDescriptions[rank].push('');
    setQuestionFormData({ ...questionFormData, rankDescriptions });
  };

  const handleDeleteRankDescription = (rank: string, index: number) => {
    const rankDescriptions = { ...(questionFormData.rankDescriptions || {}) };
    if (rankDescriptions[rank]) {
      rankDescriptions[rank] = rankDescriptions[rank].filter((_, idx) => idx !== index);
    }
    setQuestionFormData({ ...questionFormData, rankDescriptions });
  };

  const needsOptions = (type: QuestionType) => {
    return type === 'radio' || type === 'checkbox' || type === 'rank';
  };

  const renderQuestionPreview = (question: Question, index: number) => {
    const isSelected = selectedQuestionIndex === index;
    
    const isDragging = dragIndex === index;
    const isDragOver = dragOverIndex === index && dragIndex !== index;

    return (
      <div
        key={question.id}
        draggable={true}
        onDragStart={(e) => {
          setDragIndex(index);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDragOverIndex(index);
        }}
        onDragLeave={() => {
          setDragOverIndex(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (dragIndex !== null) {
            handleReorderQuestion(dragIndex, index);
          }
          setDragIndex(null);
          setDragOverIndex(null);
        }}
        onDragEnd={() => {
          setDragIndex(null);
          setDragOverIndex(null);
        }}
        onClick={() => handleSelectQuestion(index)}
        className={`bg-white rounded-lg border-2 p-6 mb-4 cursor-pointer transition-all ${
          isSelected
            ? 'border-sky-500 shadow-lg'
            : 'border-slate-200 hover:border-slate-300'
        } ${isDragging ? 'opacity-40' : ''} ${isDragOver ? 'border-sky-400 shadow-md ring-2 ring-sky-200' : ''}`}
        style={isDragOver ? { borderTopWidth: '4px', borderTopColor: '#38bdf8' } : {}}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-slate-700">
                {question.title || '無題の質問'}
              </span>
              {question.required && (
                <span className="text-xs text-red-500">*</span>
              )}
            </div>
            <span className="text-xs text-slate-500">
              {question.type === 'radio' && 'ラジオボタン'}
              {question.type === 'checkbox' && 'チェックボックス'}
              {question.type === 'text' && 'テキスト入力'}
              {question.type === 'textarea' && 'テキストエリア'}
              {question.type === 'rank' && 'ランク評価'}
            </span>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMoveQuestion(index, 'up');
              }}
              disabled={index === 0}
              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="上に移動"
            >
              ↑
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMoveQuestion(index, 'down');
              }}
              disabled={index === editedSurvey.questions.length - 1}
              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="下に移動"
            >
              ↓
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicateQuestion(index);
              }}
              className="p-1 text-slate-400 hover:text-slate-600"
              title="複製"
            >
              📋
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteQuestion(index);
              }}
              className="p-1 text-red-400 hover:text-red-600"
              title="削除"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* プレビュー表示 */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          {question.type === 'radio' && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <label key={option.id} className="flex items-center gap-2">
                  <input type="radio" name={`preview-${question.id}`} disabled className="text-sky-500" />
                  <span className="text-sm text-slate-700">{option.label}</span>
                </label>
              ))}
            </div>
          )}
          {question.type === 'checkbox' && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <label key={option.id} className="flex items-center gap-2">
                  <input type="checkbox" disabled className="text-sky-500" />
                  <span className="text-sm text-slate-700">{option.label}</span>
                </label>
              ))}
            </div>
          )}
          {question.type === 'text' && (
            <input
              type="text"
              disabled
              placeholder={question.placeholder || '短文回答'}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm text-slate-500 bg-slate-50"
            />
          )}
          {question.type === 'textarea' && (
            <textarea
              disabled
              placeholder={question.placeholder || '長文回答'}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm text-slate-500 bg-slate-50"
            />
          )}
          {question.type === 'rank' && question.options && (
            <div className="space-y-3">
              {question.options.map((option) => (
                <div key={option.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="font-medium text-sm text-slate-700 mb-2">{option.label}</div>
                  {question.rankDescriptions?.[option.value] && (
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                      {question.rankDescriptions[option.value].map((desc, idx) => (
                        <li key={idx}>{desc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* 左側：フォームプレビュー */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-sky-400 rounded-t-lg p-6 mb-4">
            <input
              type="text"
              value={editedSurvey.title}
              onChange={(e) => handleUpdateSurvey({ title: e.target.value })}
              className="w-full text-2xl font-bold text-white bg-transparent border-none outline-none placeholder-blue-200"
              placeholder="アンケートタイトル"
            />
            <textarea
              value={editedSurvey.description || ''}
              onChange={(e) => handleUpdateSurvey({ description: e.target.value })}
              className="w-full mt-2 text-white bg-transparent border-none outline-none placeholder-blue-200 resize-none"
              placeholder="説明を入力してください"
              rows={2}
            />
          </div>

          {/* 質問一覧 */}
          <div className="space-y-4">
            {editedSurvey.questions.map((question, index) => renderQuestionPreview(question, index))}
          </div>

          {/* 質問追加ボタン */}
          <button
            onClick={handleAddQuestion}
            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-sky-400 hover:text-sky-500 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            <span>質問を追加</span>
          </button>
        </div>
      </div>

      {/* 右側：編集パネル */}
      <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto">
        {isEditingQuestion && selectedQuestionIndex !== null ? (
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">質問を編集</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  質問タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={questionFormData.title || ''}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="質問内容を入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  質問タイプ
                </label>
                <select
                  value={questionFormData.type || 'radio'}
                  onChange={(e) => {
                    const newType = e.target.value as QuestionType;
                    setQuestionFormData({
                      ...questionFormData,
                      type: newType,
                      options: needsOptions(newType) ? (questionFormData.options || []) : undefined,
                      rankDescriptions: newType === 'rank' ? (questionFormData.rankDescriptions || {}) : undefined,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="radio">ラジオボタン</option>
                  <option value="checkbox">チェックボックス</option>
                  <option value="text">テキスト入力</option>
                  <option value="textarea">テキストエリア</option>
                  <option value="rank">ランク評価</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={questionFormData.required ?? false}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, required: e.target.checked })}
                    className="w-4 h-4 text-sky-500 border-slate-300 rounded focus:ring-sky-500"
                  />
                  必須項目にする
                </label>
              </div>

              {(questionFormData.type === 'text' || questionFormData.type === 'textarea') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      プレースホルダー
                    </label>
                    <input
                      type="text"
                      value={questionFormData.placeholder || ''}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, placeholder: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  {questionFormData.type === 'textarea' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        最大文字数
                      </label>
                      <input
                        type="number"
                        value={questionFormData.maxLength || ''}
                        onChange={(e) => setQuestionFormData({
                          ...questionFormData,
                          maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  )}
                </>
              )}

              {needsOptions(questionFormData.type || 'radio') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      選択肢
                    </label>
                    <button
                      onClick={handleAddOption}
                      className="text-xs px-2 py-1 bg-blue-50 text-sky-500 rounded hover:bg-sky-100"
                    >
                      + 追加
                    </button>
                  </div>
                  <div className="space-y-2">
                    {questionFormData.options?.map((option, optIndex) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => handleUpdateOption(optIndex, 'label', e.target.value)}
                          placeholder="選択肢"
                          className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          onClick={() => handleDeleteOption(optIndex)}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {questionFormData.type === 'rank' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ランク評価の説明
                  </label>
                  <div className="space-y-3">
                    {questionFormData.options?.map((option) => {
                      const rank = option.value;
                      const descriptions = questionFormData.rankDescriptions?.[rank] || [];
                      return (
                        <div key={option.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                          <div className="font-medium text-xs text-slate-700 mb-2">{option.label}</div>
                          <div className="space-y-2">
                            {descriptions.map((desc, descIndex) => (
                              <div key={descIndex} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={desc}
                                  onChange={(e) => handleUpdateRankDescription(rank, descIndex, e.target.value)}
                                  placeholder="説明文"
                                  className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                                <button
                                  onClick={() => handleDeleteRankDescription(rank, descIndex)}
                                  className="px-1.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                                >
                                  削除
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => handleAddRankDescription(rank)}
                              className="text-xs px-2 py-1 bg-blue-50 text-sky-500 rounded hover:bg-sky-100"
                            >
                              + 説明を追加
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={handleSaveQuestion}
                  className="flex-1 px-4 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 transition-colors text-sm"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setIsEditingQuestion(false);
                    setSelectedQuestionIndex(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">編集パネル</h3>
            <p className="text-sm text-slate-600">
              左側の質問をクリックして編集を開始してください。
            </p>
            <div className="mt-6 space-y-2">
              <button
                onClick={handleAddQuestion}
                className="w-full px-4 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 transition-colors text-sm"
              >
                + 新しい質問を追加
              </button>
            </div>
          </div>
        )}

        {/* 保存・キャンセルボタン */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!editedSurvey.title?.trim()) {
                  alert('アンケートタイトルを入力してください。');
                  return;
                }
                onSave(editedSurvey);
              }}
              className="flex-1 px-4 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 transition-colors font-medium"
            >
              保存して終了
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyEditor;

